<?php
declare(strict_types=1);

/**
 * Installer: creates tables and seeds/resets the admin account.
 * Each run generates a new random password and displays it once.
 */
$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
  http_response_code(500);
  echo 'Missing config.php. Copy config.example.php and set your MySQL credentials.';
  exit;
}

$config = require $configPath;
$db = $config['db'];
$admin = $config['admin'] ?? [];
$username = (string) ($admin['username'] ?? 'admin');
$passwordWasReset = false;

/** @return string Cryptographically strong password (~16 chars, URL-safe) */
function contact_generate_password(int $bytes = 12): string {
  return rtrim(strtr(base64_encode(random_bytes($bytes)), '+/', '-_'), '=');
}

$generatedPassword = contact_generate_password();
$passwordHash = password_hash($generatedPassword, PASSWORD_DEFAULT);
if ($passwordHash === false) {
  http_response_code(500);
  echo 'Could not hash password.';
  exit;
}

try {
  $dsnServer = sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $db['host'], (int) $db['port']);
  $pdo = new PDO($dsnServer, $db['user'], $db['pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  ]);
  $dbName = preg_replace('/[^a-zA-Z0-9_]/', '', (string) $db['name']);
  if ($dbName === '') {
    throw new RuntimeException('Invalid database name');
  }
  $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
  $pdo->exec("USE `{$dbName}`");

  $schema = file_get_contents(__DIR__ . '/schema.sql');
  if ($schema === false) {
    throw new RuntimeException('schema.sql missing');
  }
  foreach (array_filter(array_map('trim', explode(';', $schema))) as $sql) {
    if ($sql !== '') {
      $pdo->exec($sql);
    }
  }

  // Upgrade older installs that lack soft-hide / star
  $hiddenCol = $pdo->query("SHOW COLUMNS FROM contact_messages LIKE 'is_hidden'")->fetch();
  if (!$hiddenCol) {
    $pdo->exec(
      'ALTER TABLE contact_messages
       ADD COLUMN is_hidden TINYINT(1) NOT NULL DEFAULT 0 AFTER is_read,
       ADD KEY idx_contact_messages_hidden (is_hidden, created_at)'
    );
  }
  $starCol = $pdo->query("SHOW COLUMNS FROM contact_messages LIKE 'is_starred'")->fetch();
  if (!$starCol) {
    $pdo->exec(
      'ALTER TABLE contact_messages
       ADD COLUMN is_starred TINYINT(1) NOT NULL DEFAULT 0 AFTER is_hidden,
       ADD KEY idx_contact_messages_starred (is_starred, created_at)'
    );
  }

  $existing = $pdo->query('SELECT id FROM contact_admin ORDER BY id ASC LIMIT 1')->fetch();
  if ($existing) {
    $stmt = $pdo->prepare(
      'UPDATE contact_admin SET username = :u, password_hash = :p WHERE id = :id'
    );
    $stmt->execute([
      ':u' => $username,
      ':p' => $passwordHash,
      ':id' => (int) $existing['id'],
    ]);
    $passwordWasReset = true;
  } else {
    $stmt = $pdo->prepare(
      'INSERT INTO contact_admin (username, password_hash) VALUES (:u, :p)'
    );
    $stmt->execute([
      ':u' => $username,
      ':p' => $passwordHash,
    ]);
  }

  // Persist hash only (never store plaintext password in config)
  $config['admin'] = [
    'username' => $username,
    'password_hash' => $passwordHash,
  ];
  $exported = var_export($config, true);
  $php = "<?php\n/**\n * Adawwa self-hosted contact admin config.\n * Updated by install.php — keep this file private.\n */\nreturn {$exported};\n";
  @file_put_contents($configPath, $php);
} catch (Throwable $e) {
  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  echo "Install failed: " . $e->getMessage();
  exit;
}

header('Content-Type: text/html; charset=utf-8');
$safeUser = htmlspecialchars($username, ENT_QUOTES, 'UTF-8');
$safePass = htmlspecialchars($generatedPassword, ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title><?= $passwordWasReset ? 'Admin password reset' : 'Contact admin installed' ?></title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.5; color: #15201c; }
    code, .cred { background: #f3f4f6; padding: 0.15rem 0.45rem; border-radius: 6px; font-family: ui-monospace, monospace; }
    .box { border: 1px solid #dde5e1; background: #f8faf9; border-radius: 12px; padding: 1rem 1.15rem; margin: 1.25rem 0; }
    .box dt { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #5f6f68; margin-top: 0.65rem; }
    .box dt:first-child { margin-top: 0; }
    .box dd { margin: 0.25rem 0 0; font-size: 1.05rem; font-weight: 700; word-break: break-all; }
    a { color: #0f766e; }
    .warn { color: #b45309; font-size: 0.9rem; }
    .ok { color: #047857; }
  </style>
</head>
<body>
  <?php if ($passwordWasReset): ?>
    <h1>Admin password reset</h1>
    <p class="ok">An admin account already existed. A new random password was generated and saved.</p>
  <?php else: ?>
    <h1>Install complete</h1>
    <p>Database tables are ready and the admin account is seeded with a random password.</p>
  <?php endif; ?>

  <div class="box">
    <dl>
      <dt>Admin username</dt>
      <dd><span class="cred"><?= $safeUser ?></span></dd>
      <dt>Generated password</dt>
      <dd><span class="cred"><?= $safePass ?></span></dd>
    </dl>
  </div>

  <p class="warn">Save this password now — it is not stored in plaintext and will not be shown again unless you reopen <code>install.php</code> (which generates a new one).</p>
  <p><strong>Next:</strong> open <a href="./admin/">./admin/</a> and sign in.</p>
  <p class="warn">Delete or protect <code>install.php</code> after setup so others cannot reset the password.</p>
</body>
</html>
