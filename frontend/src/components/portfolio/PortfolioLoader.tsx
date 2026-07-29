import type { TemplateSlug } from '../../templates/catalog';

type LoaderTheme = TemplateSlug;

const THEME_CACHE_KEY = 'pf-loader-theme';
const THEME_ROUTE_PREFIX = 'pf-loader-theme:';
const LOADER_THEMES: LoaderTheme[] = ['minimal', 'developer', 'aurora', 'editorial', 'noir'];

function isLoaderTheme(value: string | null): value is LoaderTheme {
  return value !== null && (LOADER_THEMES as string[]).includes(value);
}

export function rememberPortfolioLoaderTheme(theme: string, userRoute?: string) {
  const normalized = theme === 'terminal' ? 'developer' : theme;
  if (!isLoaderTheme(normalized)) return;
  try {
    sessionStorage.setItem(THEME_CACHE_KEY, normalized);
    if (userRoute) sessionStorage.setItem(`${THEME_ROUTE_PREFIX}${userRoute}`, normalized);
  } catch {
    /* ignore */
  }
}

export function readPortfolioLoaderTheme(userRoute?: string): LoaderTheme {
  try {
    if (userRoute) {
      const byRoute = sessionStorage.getItem(`${THEME_ROUTE_PREFIX}${userRoute}`);
      if (isLoaderTheme(byRoute)) return byRoute;
    }
    const value = sessionStorage.getItem(THEME_CACHE_KEY);
    if (isLoaderTheme(value)) return value;
  } catch {
    /* ignore */
  }
  return 'minimal';
}

function LoaderVisual({ theme }: { theme: LoaderTheme }) {
  if (theme === 'developer') {
    return (
      <div className="pf-loader-window" aria-hidden>
        <div className="pf-loader-window-bar">
          <span />
          <span />
          <span />
          <code>loading.sh</code>
        </div>
        <div className="pf-loader-window-body">
          <p>
            <span className="pf-loader-ps1">$</span> fetch portfolio --wait
          </p>
          <p className="pf-loader-cursor">
            <span className="pf-loader-ps1">$</span>
            <i />
          </p>
        </div>
      </div>
    );
  }

  if (theme === 'aurora') {
    return (
      <div className="pf-loader-aurora" aria-hidden>
        <span className="pf-loader-orb pf-loader-orb-a" />
        <span className="pf-loader-orb pf-loader-orb-b" />
        <span className="pf-loader-orb pf-loader-orb-c" />
        <div className="pf-loader-aurora-core">
          <span className="pf-loader-aurora-ring" />
          <span className="pf-loader-aurora-dot" />
        </div>
      </div>
    );
  }

  if (theme === 'editorial') {
    return (
      <div className="pf-loader-editorial" aria-hidden>
        <div className="pf-loader-mast">
          <span>Portfolio</span>
          <span>Loading</span>
        </div>
        <div className="pf-loader-editorial-lines">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (theme === 'noir') {
    return (
      <div className="pf-loader-noir" aria-hidden>
        <span className="pf-loader-noir-grain" />
        <p className="pf-loader-noir-kicker">Reel / Loading</p>
        <div className="pf-loader-noir-bar">
          <i />
        </div>
      </div>
    );
  }

  return (
    <>
      <img className="pf-loader-mark" src="/logo-mark.png" alt="" width={44} height={44} />
      <div className="pf-loader-skeleton" aria-hidden>
        <span className="pf-loader-line pf-loader-line-sm" />
        <span className="pf-loader-line pf-loader-line-lg" />
        <span className="pf-loader-line pf-loader-line-md" />
      </div>
    </>
  );
}

function loaderLabel(theme: LoaderTheme, label: string): string {
  if (label !== 'Loading portfolio') return label;
  if (theme === 'developer') return 'fetching portfolio…';
  if (theme === 'aurora') return 'Warming up the aurora…';
  if (theme === 'editorial') return 'Setting the type…';
  if (theme === 'noir') return 'Cueing the reel…';
  return label;
}

export function PortfolioLoader({
  label = 'Loading portfolio',
  theme,
  userRoute,
}: {
  label?: string;
  theme?: LoaderTheme;
  userRoute?: string;
}) {
  const resolved = theme ?? readPortfolioLoaderTheme(userRoute);

  return (
    <div
      className={`pf-loader pf-loader--${resolved}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="pf-loader-glow" aria-hidden />
      <div className="pf-loader-inner">
        <LoaderVisual theme={resolved} />
        <p className="pf-loader-label">{loaderLabel(resolved, label)}</p>
      </div>
    </div>
  );
}
