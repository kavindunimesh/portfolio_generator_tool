export const RESERVED_ROUTES = new Set([
  'admin',
  'api',
  'login',
  'register',
  'new',
  'edit',
  'download',
  'assets',
  'dashboard',
  'builder',
  'portfolio',
  'inbox',
  'contact',
  'health',
  'templates',
  'public',
  'www',
  'static',
  'favicon',
  'robots',
  'sitemap',
]);

export function isValidUserRoute(route: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route) && route.length >= 3 && route.length <= 32;
}

export function isReservedRoute(route: string): boolean {
  return RESERVED_ROUTES.has(route.toLowerCase());
}
