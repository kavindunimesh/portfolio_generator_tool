import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Portfolio } from '../api';
import { DocumentMeta } from '../components/DocumentMeta';
import { NoIndex } from '../components/NoIndex';
import { PortfolioLoader, rememberPortfolioLoaderTheme } from '../components/portfolio/PortfolioLoader';
import { PortfolioView } from '../components/portfolio/PortfolioView';
import { stripMarkdown } from '../lib/markdown';

export function PublicPortfolioPage() {
  const { userRoute = '' } = useParams();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError('');
    setPortfolio(null);
    void api
      .publicPortfolio(userRoute)
      .then((data) => {
        rememberPortfolioLoaderTheme(
          data.templateSlug === 'developer' ? 'developer' : 'minimal',
          userRoute,
        );
        setPortfolio(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Not found'))
      .finally(() => setLoading(false));
  }, [userRoute]);

  const seo = useMemo(() => {
    if (!portfolio) return null;
    const { personal, seo: tags } = portfolio;
    const defaultTitle = personal.fullName
      ? `${personal.fullName}${personal.headline ? ` — ${personal.headline}` : ''}`
      : 'Portfolio';
    const pageTitle = tags?.title?.trim() || defaultTitle;
    const metaDescription =
      tags?.description?.trim() ||
      stripMarkdown(personal.bio || '').slice(0, 155) ||
      `${personal.fullName || 'Portfolio'} portfolio`;
    return {
      title: pageTitle,
      description: metaDescription,
      keywords: tags?.keywords?.trim() || '',
      ogTitle: tags?.ogTitle?.trim() || pageTitle,
      ogDescription: tags?.ogDescription?.trim() || metaDescription,
      ogImageUrl: tags?.ogImageUrl?.trim() || personal.avatarUrl || '',
      faviconUrl: tags?.faviconUrl?.trim() || '',
      twitterCard: tags?.twitterCard || 'summary_large_image',
      canonicalUrl: tags?.canonicalUrl?.trim() || '',
    };
  }, [portfolio]);

  if (loading) {
    return (
      <>
        <NoIndex />
        <PortfolioLoader userRoute={userRoute} />
      </>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="hosted-wrap">
        <main className="hosted">
          <NoIndex />
          <h1>Portfolio not found</h1>
          <p className="muted">This route may be unpublished or does not exist.</p>
          <Link to="/">← Back home</Link>
        </main>
      </div>
    );
  }

  return (
    <>
      <NoIndex />
      {seo && <DocumentMeta {...seo} />}
      <PortfolioView portfolio={portfolio} />
    </>
  );
}
