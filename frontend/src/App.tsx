import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth';
import { ToastProvider } from './toast';
import { AppShell, RequireAuth } from './components/AppShell';
import { ScrollToTop } from './components/ScrollToTop';
import { HomePage } from './pages/HomePage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { BuilderPage } from './pages/BuilderPage';
import { InboxPage } from './pages/InboxPage';
import { PublicPortfolioPage } from './pages/PublicPortfolioPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="portfolio/:userRoute" element={<PublicPortfolioPage />} />
              <Route element={<RequireAuth />}>
                <Route path="builder" element={<BuilderPage />} />
                <Route path="inbox" element={<InboxPage />} />
                <Route path="dashboard" element={<Navigate to="/builder" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
