import { useEffect } from 'react';

type Props = {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  faviconUrl?: string;
  twitterCard?: string;
  canonicalUrl?: string;
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return () => undefined;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  const created = !el;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  const previous = el.content;
  el.content = content;
  return () => {
    if (created && el) el.remove();
    else if (el) el.content = previous;
  };
}

/** Sets document title and social/meta tags for the current view. */
export function DocumentMeta({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImageUrl,
  faviconUrl,
  twitterCard,
  canonicalUrl,
}: Props) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    const cleanups = [
      upsertMeta('name', 'description', description || ''),
      upsertMeta('name', 'keywords', keywords || ''),
      upsertMeta('property', 'og:title', ogTitle || title || ''),
      upsertMeta('property', 'og:description', ogDescription || description || ''),
      upsertMeta('property', 'og:image', ogImageUrl || ''),
      upsertMeta('property', 'og:type', 'website'),
      upsertMeta('name', 'twitter:card', twitterCard || 'summary_large_image'),
      upsertMeta('name', 'twitter:title', ogTitle || title || ''),
      upsertMeta('name', 'twitter:description', ogDescription || description || ''),
      upsertMeta('name', 'twitter:image', ogImageUrl || ''),
    ];

    let canonical: HTMLLinkElement | null = null;
    let canonicalCreated = false;
    let previousCanonical = '';
    if (canonicalUrl) {
      canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      canonicalCreated = !canonical;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      previousCanonical = canonical.href;
      canonical.href = canonicalUrl;
    }

    let icon: HTMLLinkElement | null = null;
    let iconCreated = false;
    let previousIcon = '';
    let previousIconType = '';
    if (faviconUrl) {
      icon = document.head.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      iconCreated = !icon;
      if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        document.head.appendChild(icon);
      }
      previousIcon = icon.href;
      previousIconType = icon.type;
      icon.href = faviconUrl;
      icon.type = 'image/png';
    }

    return () => {
      if (title) document.title = previousTitle;
      cleanups.forEach((fn) => fn?.());
      if (canonical) {
        if (canonicalCreated) canonical.remove();
        else canonical.href = previousCanonical;
      }
      if (icon) {
        if (iconCreated) icon.remove();
        else {
          icon.href = previousIcon;
          icon.type = previousIconType;
        }
      }
    };
  }, [
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    ogImageUrl,
    faviconUrl,
    twitterCard,
    canonicalUrl,
  ]);

  return null;
}
