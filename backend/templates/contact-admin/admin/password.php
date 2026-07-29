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

if (empty($_SESSION['admin_id'])) {
  header('Location: ./login.php');
  exit;
}

$error = '';
$success = '';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $current = (string) ($_POST['current_password'] ?? '');
  $next = (string) ($_POST['new_password'] ?? '');
  $confirm = (string) ($_POST['confirm_password'] ?? '');

  if ($current === '' || $next === '' || $confirm === '') {
    $error = 'All fields are required.';
  } elseif (strlen($next) < 8) {
    $error = 'New password must be at least 8 characters.';
  } elseif (strlen($next) > 128) {
    $error = 'New password is too long.';
  } elseif ($next !== $confirm) {
    $error = 'New password and confirmation do not match.';
  } else {
    try {
      $pdo = contact_pdo();
      $stmt = $pdo->prepare('SELECT id, password_hash FROM contact_admin WHERE id = :id LIMIT 1');
      $stmt->execute([':id' => (int) $_SESSION['admin_id']]);
      $row = $stmt->fetch();

      if (!$row || !password_verify($current, (string) $row['password_hash'])) {
        $error = 'Current password is incorrect.';
      } else {
        $hash = password_hash($next, PASSWORD_DEFAULT);
        $upd = $pdo->prepare('UPDATE contact_admin SET password_hash = :h WHERE id = :id');
        $upd->execute([
          ':h' => $hash,
          ':id' => (int) $row['id'],
        ]);
        session_regenerate_id(true);
        $success = 'Password updated. Use the new password next time you sign in.';
      }
    } catch (Throwable $e) {
      $error = 'Could not update password. Check database connection.';
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
  <title>Change password</title>
  <style>
    :root { color-scheme: light; --accent: #0f766e; --border: #dde5e1; --muted: #5f6f68; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; background: #f5f7f6; color: #15201c; }
    header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: #fff; border-bottom: 1px solid var(--border); }
    h1 { margin: 0; font-size: 1.25rem; }
    .nav { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    a.btn { display: inline-flex; align-items: center; text-decoration: none; border: 1px solid var(--border); background: #fff; color: inherit; padding: 0.45rem 0.8rem; border-radius: 8px; font: inherit; }
    main { max-width: 420px; margin: 0 auto; padding: 1.25rem; }
    form { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem; display: grid; gap: 0.85rem; }
    label { display: grid; gap: 0.35rem; font-size: 0.85rem; font-weight: 600; }
    input { padding: 0.65rem 0.75rem; border-radius: 8px; border: 1px solid #c5d0cb; font: inherit; }
    button { border: 0; border-radius: 10px; padding: 0.75rem; background: var(--accent); color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
    .err { color: #dc2626; font-size: 0.85rem; margin: 0; }
    .ok { color: #047857; font-size: 0.85rem; margin: 0; }
    .hint { color: var(--muted); font-size: 0.82rem; margin: 0; }
  </style>
</head>
<body>
  <header>
    <h1>Change password</h1>
    <div class="nav">
      <a class="btn" href="./">Inbox</a>
      <a class="btn" href="./?action=logout">Log out</a>
    </div>
  </header>
  <main>
    <form method="post" autocomplete="off">
      <?php if ($error): ?><p class="err"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
      <?php if ($success): ?><p class="ok"><?= htmlspecialchars($success, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
      <label>
        Current password
        <input type="password" name="current_password" required maxlength="128" autocomplete="current-password" />
      </label>
      <label>
        New password
        <input type="password" name="new_password" required minlength="8" maxlength="128" autocomplete="new-password" />
      </label>
      <label>
        Confirm new password
        <input type="password" name="confirm_password" required minlength="8" maxlength="128" autocomplete="new-password" />
      </label>
      <p class="hint">Minimum 8 characters.</p>
      <button type="submit">Update password</button>
    </form>
  </main>
</body>
</html>
