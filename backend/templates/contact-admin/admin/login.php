<?php
declare(strict_types=1);
require __DIR__ . '/../lib.php';

$cfg = contact_config();
session_name((string) ($cfg['security']['session_name'] ?? 'adawwa_contact_admin'));
session_start([
  'cookie_httponly' => true,
  'cookie_samesite' => 'Lax',
  'use_strict_mode' => true,
]);

if (!empty($_SESSION['admin_id'])) {
  header('Location: ./');
  exit;
}

$error = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $ip = contact_client_ip();
  if (!contact_rate_limit('login:' . $ip, 10, 900)) {
    $error = 'Too many login attempts. Try again later.';
  } else {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    try {
      $pdo = contact_pdo();
      $stmt = $pdo->prepare('SELECT id, username, password_hash FROM contact_admin WHERE username = :u LIMIT 1');
      $stmt->execute([':u' => $username]);
      $row = $stmt->fetch();
      if ($row && password_verify($password, (string) $row['password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['admin_id'] = (int) $row['id'];
        $_SESSION['admin_username'] = (string) $row['username'];
        header('Location: ./');
        exit;
      }
      $error = 'Invalid username or password';
    } catch (Throwable $e) {
      $error = 'Database error. Run install.php first.';
    }
  }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Contact admin login</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f5f7f6; margin: 0; min-height: 100vh; display: grid; place-items: center; }
    form { width: min(360px, calc(100% - 2rem)); background: #fff; border: 1px solid #dde5e1; border-radius: 14px; padding: 1.35rem; display: grid; gap: 0.85rem; }
    h1 { margin: 0; font-size: 1.2rem; }
    label { display: grid; gap: 0.35rem; font-size: 0.85rem; font-weight: 600; }
    input { padding: 0.65rem 0.75rem; border-radius: 8px; border: 1px solid #c5d0cb; font: inherit; }
    button { border: 0; border-radius: 10px; padding: 0.75rem; background: #0f766e; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
    .err { color: #dc2626; font-size: 0.85rem; margin: 0; }
  </style>
</head>
<body>
  <form method="post" autocomplete="username">
    <h1>Contact admin</h1>
    <?php if ($error): ?><p class="err"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
    <label>
      Username
      <input name="username" required maxlength="64" />
    </label>
    <label>
      Password
      <input type="password" name="password" required maxlength="128" autocomplete="current-password" />
    </label>
    <button type="submit">Sign in</button>
  </form>
</body>
</html>
