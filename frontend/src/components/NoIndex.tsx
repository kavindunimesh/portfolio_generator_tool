import { useEffect } from 'react';

/** Sets noindex for app / hosted portfolio routes. */
export function NoIndex() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    const previous = meta.content;
    meta.content = 'noindex, nofollow';
    return () => {
      if (created && meta) meta.remove();
      else if (meta) meta.content = previous || 'index, follow';
    };
  }, []);
  return null;
}
