import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth';
import { ToastProvider } from './toast';
import { AppShell, RequireAuth } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { BuilderPage } from './pages/BuilderPage';
import { PublicPortfolioPage } from './pages/PublicPortfolioPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="portfolio/:userRoute" element={<PublicPortfolioPage />} />
              <Route element={<RequireAuth />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="builder" element={<BuilderPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
