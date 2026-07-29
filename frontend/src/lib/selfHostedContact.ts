/** Match backend `selfHostedContactSubmitUrl` — form POST target for PHP admin. */
export function selfHostedContactSubmitUrl(adminDomain?: string | null): string {
  const raw = (adminDomain || '').trim().replace(/\/+$/, '');
  // ZIP co-located admin folder (no domain configured)
  if (!raw) return './contact-admin/api/submit.php';

  let base = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  base = base.replace(/\/+$/, '');

  if (/\/api\/submit\.php$/i.test(base)) return base;
  if (/\/api$/i.test(base)) return `${base}/submit.php`;
  return `${base}/api/submit.php`;
}
