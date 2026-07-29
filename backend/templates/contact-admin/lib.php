<?php
declare(strict_types=1);

function contact_config(): array {
  static $config = null;
  if ($config !== null) return $config;
  $path = __DIR__ . '/config.php';
  if (!is_file($path)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing config.php — copy config.example.php and run install.php']);
    exit;
  }
  $config = require $path;
  return $config;
}

function contact_pdo(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;
  $db = contact_config()['db'];
  $dsn = sprintf(
    'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
    $db['host'],
    (int) $db['port'],
    $db['name']
  );
  $pdo = new PDO($dsn, $db['user'], $db['pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

function contact_json(array $payload, int $status = 200): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('X-Content-Type-Options: nosniff');
  echo json_encode($payload);
  exit;
}

function contact_client_ip(): string {
  if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $parts = explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR']);
    return trim($parts[0]);
  }
  return (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
}

function contact_rate_limit(string $key, int $limit, int $windowSec): bool {
  $dir = sys_get_temp_dir() . '/adawwa_contact_rate';
  if (!is_dir($dir)) {
    @mkdir($dir, 0700, true);
  }
  $file = $dir . '/' . hash('sha256', $key) . '.json';
  $now = time();
  $data = ['count' => 0, 'reset' => $now + $windowSec];
  if (is_file($file)) {
    $raw = @file_get_contents($file);
    $parsed = $raw ? json_decode($raw, true) : null;
    if (is_array($parsed) && isset($parsed['count'], $parsed['reset']) && (int) $parsed['reset'] > $now) {
      $data = ['count' => (int) $parsed['count'], 'reset' => (int) $parsed['reset']];
    }
  }
  if ($data['count'] >= $limit) {
    return false;
  }
  $data['count'] += 1;
  @file_put_contents($file, json_encode($data), LOCK_EX);
  return true;
}

/**
 * Multi-tier limits for public contact submit (scan / flood protection).
 * @return true if allowed
 */
function contact_submit_rate_limits(string $ip, ?string $email = null, ?string $contentHash = null): bool {
  $checks = [
    ['submit:burst:ip:' . $ip, 2, 60],
    ['submit:ip:' . $ip, 8, 900],
    ['submit:form:ip:' . $ip, 3, 900],
    ['submit:form', 40, 3600],
  ];
  if ($email !== null && $email !== '') {
    $checks[] = ['submit:email:' . strtolower($email), 3, 3600];
  }
  if ($contentHash !== null && $contentHash !== '') {
    $checks[] = ['submit:dup:' . $contentHash, 1, 600];
  }
  foreach ($checks as [$key, $limit, $window]) {
    if (!contact_rate_limit($key, (int) $limit, (int) $window)) {
      return false;
    }
  }
  return true;
}

function contact_looks_like_bot_timing($formStartedAt): bool {
  if ($formStartedAt === null || $formStartedAt === '') {
    return true;
  }
  $started = is_numeric($formStartedAt) ? (float) $formStartedAt : NAN;
  if (!is_finite($started) || $started <= 0) {
    return true;
  }
  // Accept seconds or milliseconds
  if ($started < 1_000_000_000_000) {
    $started *= 1000;
  }
  $ageMs = (int) (microtime(true) * 1000) - (int) $started;
  return $ageMs < 2500 || $ageMs > 6 * 60 * 60 * 1000;
}

function contact_require_post_json(): array {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    contact_json(['error' => 'Method not allowed'], 405);
  }
  $raw = file_get_contents('php://input') ?: '';
  $data = json_decode($raw, true);
  if (!is_array($data)) {
    // Also accept classic form posts for simpler hosting
    $data = $_POST;
  }
  return is_array($data) ? $data : [];
}
