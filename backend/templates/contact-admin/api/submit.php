<?php
declare(strict_types=1);
require __DIR__ . '/../lib.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$ip = contact_client_ip();

// Cheap early gate for scan floods
if (!contact_rate_limit('submit:early:ip:' . $ip, 12, 60)) {
  header('Retry-After: 60');
  contact_json(['error' => 'Too many messages. Try again later.'], 429);
}

$data = contact_require_post_json();
$website = trim((string) ($data['website'] ?? ($data['honeypot'] ?? '')));
$formStartedAt = $data['formStartedAt'] ?? ($data['form_started_at'] ?? null);

// Honeypot / instant scanner posts — fake success
if ($website !== '' || contact_looks_like_bot_timing($formStartedAt)) {
  contact_json(['ok' => true]);
}

$name = trim((string) ($data['name'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$subject = trim((string) ($data['subject'] ?? ''));
$message = trim((string) ($data['message'] ?? ''));

if ($name === '' || mb_strlen($name) > 120) {
  if (!contact_rate_limit('submit:bad:ip:' . $ip, 8, 600)) {
    header('Retry-After: 60');
    contact_json(['error' => 'Too many messages. Try again later.'], 429);
  }
  contact_json(['error' => 'Invalid name'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255) {
  if (!contact_rate_limit('submit:bad:ip:' . $ip, 8, 600)) {
    header('Retry-After: 60');
    contact_json(['error' => 'Too many messages. Try again later.'], 429);
  }
  contact_json(['error' => 'Invalid email'], 400);
}
if (mb_strlen($subject) > 200) {
  contact_json(['error' => 'Subject too long'], 400);
}
if (mb_strlen($message) < 10 || mb_strlen($message) > 4000) {
  if (!contact_rate_limit('submit:bad:ip:' . $ip, 8, 600)) {
    header('Retry-After: 60');
    contact_json(['error' => 'Too many messages. Try again later.'], 429);
  }
  contact_json(['error' => 'Message must be 10–4000 characters'], 400);
}

$contentHash = hash('sha256', strtolower($email) . '|' . strtolower(trim($message)));
if (!contact_submit_rate_limits($ip, $email, $contentHash)) {
  header('Retry-After: 60');
  contact_json(['error' => 'Too many messages. Try again later.'], 429);
}

$id = sprintf(
  '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
  random_int(0, 0xffff),
  random_int(0, 0xffff),
  random_int(0, 0xffff),
  random_int(0, 0x0fff) | 0x4000,
  random_int(0, 0x3fff) | 0x8000,
  random_int(0, 0xffff),
  random_int(0, 0xffff),
  random_int(0, 0xffff)
);

$ua = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);
$ipHash = hash('sha256', $ip);

try {
  $pdo = contact_pdo();
  $stmt = $pdo->prepare(
    'INSERT INTO contact_messages (id, name, email, subject, message, ip_hash, user_agent, is_read)
     VALUES (:id, :name, :email, :subject, :message, :ip_hash, :user_agent, 0)'
  );
  $stmt->execute([
    ':id' => $id,
    ':name' => $name,
    ':email' => $email,
    ':subject' => $subject,
    ':message' => $message,
    ':ip_hash' => $ipHash,
    ':user_agent' => $ua !== '' ? $ua : null,
  ]);
} catch (Throwable $e) {
  contact_json(['error' => 'Could not save message. Is the database installed?'], 500);
}

contact_json(['ok' => true], 201);
