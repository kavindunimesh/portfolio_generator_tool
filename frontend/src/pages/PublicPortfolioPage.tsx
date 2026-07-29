import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Portfolio } from '../api';
import { NoIndex } from '../components/NoIndex';
import { PortfolioView } from '../components/portfolio/PortfolioView';

export function PublicPortfolioPage() {
  const { userRoute = '' } = useParams();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void api
      .publicPortfolio(userRoute)
      .then(setPortfolio)
      .catch((err) => setError(err instanceof Error ? err.message : 'Not found'))
      .finally(() => setLoading(false));
  }, [userRoute]);

  if (loading) {
    return (
      <div className="hosted-wrap">
        <div className="loading-state">
          <span className="spinner" />
          Loading portfolio…
        </div>
        <NoIndex />
      </div>
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
      <PortfolioView portfolio={portfolio} />
    </>
  );
}
