type LoaderTheme = 'minimal' | 'developer';

const THEME_CACHE_KEY = 'pf-loader-theme';
const THEME_ROUTE_PREFIX = 'pf-loader-theme:';

export function rememberPortfolioLoaderTheme(theme: LoaderTheme, userRoute?: string) {
  try {
    sessionStorage.setItem(THEME_CACHE_KEY, theme);
    if (userRoute) sessionStorage.setItem(`${THEME_ROUTE_PREFIX}${userRoute}`, theme);
  } catch {
    /* ignore */
  }
}

export function readPortfolioLoaderTheme(userRoute?: string): LoaderTheme {
  try {
    if (userRoute) {
      const byRoute = sessionStorage.getItem(`${THEME_ROUTE_PREFIX}${userRoute}`);
      if (byRoute === 'developer' || byRoute === 'minimal') return byRoute;
    }
    const value = sessionStorage.getItem(THEME_CACHE_KEY);
    if (value === 'developer' || value === 'minimal') return value;
  } catch {
    /* ignore */
  }
  return 'minimal';
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
        {resolved === 'developer' ? (
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
        ) : (
          <>
            <img className="pf-loader-mark" src="/logo-mark.png" alt="" width={44} height={44} />
            <div className="pf-loader-skeleton" aria-hidden>
              <span className="pf-loader-line pf-loader-line-sm" />
              <span className="pf-loader-line pf-loader-line-lg" />
              <span className="pf-loader-line pf-loader-line-md" />
            </div>
          </>
        )}
        <p className="pf-loader-label">{label}</p>
      </div>
    </div>
  );
}
