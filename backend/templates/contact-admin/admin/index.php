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

function admin_logged_in(): bool {
  return !empty($_SESSION['admin_id']);
}

function require_admin(): void {
  if (!admin_logged_in()) {
    header('Location: ./login.php');
    exit;
  }
}

function inbox_query(array $extra = []): string {
  $status = (string) ($extra['status'] ?? $_GET['status'] ?? 'all');
  if (!in_array($status, ['all', 'unread', 'read', 'hidden'], true)) {
    $status = 'all';
  }
  $page = max(1, (int) ($extra['page'] ?? $_GET['page'] ?? 1));
  $q = array_key_exists('q', $extra)
    ? trim((string) $extra['q'])
    : trim((string) ($_GET['q'] ?? ''));

  $params = ['status' => $status, 'page' => $page];
  if ($q !== '') {
    $params['q'] = mb_substr($q, 0, 120);
  }
  if (isset($extra['action'])) {
    $params['action'] = (string) $extra['action'];
  }
  if (isset($extra['id'])) {
    $params['id'] = (string) $extra['id'];
  }
  return './?' . http_build_query($params);
}

function h(string $value): string {
  return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

$action = $_GET['action'] ?? '';
if ($action === 'logout') {
  $_SESSION = [];
  session_destroy();
  header('Location: ./login.php');
  exit;
}

if ($action === 'read' && admin_logged_in() && isset($_GET['id'])) {
  $pdo = contact_pdo();
  $stmt = $pdo->prepare('UPDATE contact_messages SET is_read = 1 WHERE id = :id');
  $stmt->execute([':id' => (string) $_GET['id']]);
  header('Location: ' . inbox_query());
  exit;
}

if ($action === 'hide' && admin_logged_in() && isset($_GET['id'])) {
  $pdo = contact_pdo();
  $stmt = $pdo->prepare('UPDATE contact_messages SET is_hidden = 1, is_read = 1 WHERE id = :id');
  $stmt->execute([':id' => (string) $_GET['id']]);
  header('Location: ' . inbox_query());
  exit;
}

if ($action === 'unhide' && admin_logged_in() && isset($_GET['id'])) {
  $pdo = contact_pdo();
  $stmt = $pdo->prepare('UPDATE contact_messages SET is_hidden = 0 WHERE id = :id');
  $stmt->execute([':id' => (string) $_GET['id']]);
  header('Location: ' . inbox_query());
  exit;
}

require_admin();
$pdo = contact_pdo();

// Ensure is_hidden exists for older installs
$col = $pdo->query("SHOW COLUMNS FROM contact_messages LIKE 'is_hidden'")->fetch();
if (!$col) {
  $pdo->exec(
    'ALTER TABLE contact_messages
     ADD COLUMN is_hidden TINYINT(1) NOT NULL DEFAULT 0 AFTER is_read,
     ADD KEY idx_contact_messages_hidden (is_hidden, created_at)'
  );
}

$pageSize = 10;
$status = (string) ($_GET['status'] ?? 'all');
if (!in_array($status, ['all', 'unread', 'read', 'hidden'], true)) {
  $status = 'all';
}
$page = max(1, (int) ($_GET['page'] ?? 1));
$q = trim(mb_substr((string) ($_GET['q'] ?? ''), 0, 120));

if ($status === 'hidden') {
  $where = 'WHERE is_hidden = 1';
} elseif ($status === 'unread') {
  $where = 'WHERE is_hidden = 0 AND is_read = 0';
} elseif ($status === 'read') {
  $where = 'WHERE is_hidden = 0 AND is_read = 1';
} else {
  $where = 'WHERE is_hidden = 0';
}

$bind = [];
if ($q !== '') {
  $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q) . '%';
  $where .= ' AND (name LIKE :q ESCAPE \'\\\\\' OR email LIKE :q ESCAPE \'\\\\\' OR subject LIKE :q ESCAPE \'\\\\\' OR message LIKE :q ESCAPE \'\\\\\')';
  $bind[':q'] = $like;
}

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM contact_messages {$where}");
$countStmt->execute($bind);
$total = (int) $countStmt->fetchColumn();
$totalPages = max(1, (int) ceil($total / $pageSize));
if ($page > $totalPages) {
  $page = $totalPages;
}
$offset = ($page - 1) * $pageSize;

$stmt = $pdo->prepare(
  "SELECT id, name, email, subject, message, is_read, is_hidden, created_at
   FROM contact_messages
   {$where}
   ORDER BY created_at DESC
   LIMIT :limit OFFSET :offset"
);
foreach ($bind as $key => $value) {
  $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$messages = $stmt->fetchAll();

$unread = (int) $pdo->query(
  'SELECT COUNT(*) FROM contact_messages WHERE is_read = 0 AND is_hidden = 0'
)->fetchColumn();
$visibleTotal = (int) $pdo->query(
  'SELECT COUNT(*) FROM contact_messages WHERE is_hidden = 0'
)->fetchColumn();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Contact inbox</title>
  <style>
    :root { color-scheme: light; --accent: #0f766e; --border: #dde5e1; --muted: #5f6f68; --bg: #f5f7f6; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; background: var(--bg); color: #15201c; }
    header {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;
      padding: 1rem 1.25rem; background: #fff; border-bottom: 1px solid var(--border);
    }
    .kicker { margin: 0 0 0.2rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
    h1 { margin: 0; font-size: 1.35rem; }
    .muted { color: var(--muted); font-size: 0.9rem; margin: 0.35rem 0 0; }
    .nav { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    main { max-width: 920px; margin: 0 auto; padding: 1.25rem; }
    a.btn, button.btn {
      display: inline-flex; align-items: center; justify-content: center; text-decoration: none;
      border: 1px solid var(--border); background: #fff; color: inherit;
      padding: 0.45rem 0.8rem; border-radius: 8px; font: inherit; cursor: pointer;
    }
    a.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    a.btn-ghost { background: transparent; }
    .toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 1rem; }
    .filters { display: inline-flex; flex-wrap: wrap; gap: 0.35rem; padding: 0.25rem; background: #fff; border: 1px solid var(--border); border-radius: 10px; }
    .filters a {
      text-decoration: none; color: inherit; padding: 0.4rem 0.75rem; border-radius: 7px; font-size: 0.9rem; font-weight: 600;
    }
    .filters a.is-active { background: var(--accent); color: #fff; }
    .search {
      display: flex; align-items: center; gap: 0.45rem; flex: 1 1 16rem; max-width: 22rem; min-width: min(100%, 16rem);
    }
    .search input {
      width: 100%; padding: 0.55rem 0.75rem; border-radius: 8px; border: 1px solid #c5d0cb; font: inherit;
    }
    .search .hint { font-size: 0.75rem; color: var(--muted); white-space: nowrap; }
    .card { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 1rem; margin-bottom: 0.85rem; }
    .card.unread { border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); box-shadow: inset 3px 0 0 var(--accent); }
    .meta { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; font-size: 0.82rem; color: var(--muted); margin-bottom: 0.55rem; }
    .meta strong { color: #15201c; }
    .meta a { color: var(--accent); }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
    .msg { white-space: pre-wrap; line-height: 1.55; margin: 0; }
    .empty { text-align: center; padding: 2rem 1rem; color: var(--muted); }
    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 0.75rem;
      margin-top: 1.25rem; flex-wrap: wrap;
    }
    .page-status { font-size: 0.9rem; color: var(--muted); }
    @media (max-width: 640px) {
      header { flex-direction: column; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <p class="kicker">Messages</p>
      <h1>Contact inbox</h1>
      <p class="muted"><?= (int) $unread ?> unread · <?= (int) $visibleTotal ?> visible<?= $q !== '' ? ' · search' : '' ?></p>
    </div>
    <div class="nav">
      <a class="btn btn-ghost" href="<?= h(inbox_query()) ?>">Refresh</a>
      <a class="btn" href="./password.php">Change password</a>
      <a class="btn" href="./?action=logout">Log out</a>
    </div>
  </header>
  <main>
    <div class="toolbar">
      <div class="filters" role="tablist" aria-label="Filter messages">
        <?php foreach (['all' => 'All', 'unread' => 'Unread', 'read' => 'Read', 'hidden' => 'Hidden'] as $value => $label): ?>
          <a
            role="tab"
            aria-selected="<?= $status === $value ? 'true' : 'false' ?>"
            class="<?= $status === $value ? 'is-active' : '' ?>"
            href="<?= h(inbox_query(['status' => $value, 'page' => 1])) ?>"
          ><?= h($label) ?></a>
        <?php endforeach; ?>
      </div>
      <div class="search">
        <input
          id="inbox-search"
          type="search"
          value="<?= h($q) ?>"
          placeholder="Search name, email, subject…"
          maxlength="120"
          autocomplete="off"
          spellcheck="false"
        />
        <span class="hint" id="inbox-search-hint" hidden>Searching…</span>
      </div>
    </div>
    <p class="muted" style="margin:0 0 1rem">
      <?php if ($total === 0): ?>
        <?= $q !== '' ? 'No messages match your search.' : 'No messages' ?>
      <?php else: ?>
        Showing <?= (int) ($offset + 1) ?>–<?= (int) min($offset + count($messages), $total) ?> of <?= (int) $total ?>
      <?php endif; ?>
    </p>

    <?php if (!$messages): ?>
      <div class="card empty">
        <?= $q !== ''
          ? 'No messages match “' . h($q) . '”.'
          : ($status === 'all' ? 'No messages yet.' : 'No ' . h($status) . ' messages.') ?>
      </div>
    <?php endif; ?>

    <?php foreach ($messages as $m): ?>
      <article class="card<?= empty($m['is_read']) ? ' unread' : '' ?>">
        <div class="meta">
          <strong><?= h((string) $m['name']) ?></strong>
          <a href="mailto:<?= h((string) $m['email']) ?>"><?= h((string) $m['email']) ?></a>
          <span><?= h((string) $m['created_at']) ?></span>
          <?php if (!empty($m['subject'])): ?>
            <span><?= h((string) $m['subject']) ?></span>
          <?php endif; ?>
        </div>
        <p class="msg"><?= h((string) $m['message']) ?></p>
        <div class="actions">
          <?php if ($status !== 'hidden' && empty($m['is_read'])): ?>
            <a class="btn btn-primary" href="<?= h(inbox_query(['action' => 'read', 'id' => (string) $m['id']])) ?>">Mark read</a>
          <?php endif; ?>
          <?php if ($status === 'hidden'): ?>
            <a class="btn btn-primary" href="<?= h(inbox_query(['action' => 'unhide', 'id' => (string) $m['id']])) ?>">Unhide</a>
          <?php else: ?>
            <a class="btn" href="<?= h(inbox_query(['action' => 'hide', 'id' => (string) $m['id']])) ?>">Hide</a>
          <?php endif; ?>
        </div>
      </article>
    <?php endforeach; ?>

    <?php if ($totalPages > 1): ?>
      <nav class="pagination" aria-label="Inbox pages">
        <?php if ($page > 1): ?>
          <a class="btn btn-ghost" href="<?= h(inbox_query(['page' => $page - 1])) ?>">Previous</a>
        <?php else: ?>
          <span class="btn btn-ghost" style="opacity:0.45;pointer-events:none">Previous</span>
        <?php endif; ?>
        <span class="page-status">Page <?= (int) $page ?> of <?= (int) $totalPages ?></span>
        <?php if ($page < $totalPages): ?>
          <a class="btn btn-ghost" href="<?= h(inbox_query(['page' => $page + 1])) ?>">Next</a>
        <?php else: ?>
          <span class="btn btn-ghost" style="opacity:0.45;pointer-events:none">Next</span>
        <?php endif; ?>
      </nav>
    <?php endif; ?>
  </main>
  <script>
  (function () {
    var input = document.getElementById('inbox-search');
    var hint = document.getElementById('inbox-search-hint');
    if (!input) return;
    var initial = <?= json_encode($q, JSON_UNESCAPED_UNICODE) ?>;
    var timer = null;
    var DEBOUNCE_MS = 400;

    function navigate(q) {
      var url = new URL(window.location.href);
      url.searchParams.set('status', <?= json_encode($status) ?>);
      url.searchParams.set('page', '1');
      if (q) url.searchParams.set('q', q);
      else url.searchParams.delete('q');
      window.location.href = url.pathname + url.search;
    }

    input.addEventListener('input', function () {
      var next = input.value.trim();
      if (hint) hint.hidden = next === initial;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        if (next === initial) {
          if (hint) hint.hidden = true;
          return;
        }
        navigate(next);
      }, DEBOUNCE_MS);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (timer) clearTimeout(timer);
        navigate(input.value.trim());
      }
    });
  })();
  </script>
</body>
</html>
