import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { GuideShell } from './components/GuideShell';
import { useCity } from './lib/city';
import { SiteFooter } from './components/SiteFooter';
import { SiteMenu } from './components/SiteMenu';
import { CityGate } from './pages/CityGate';
import { CreatePage } from './pages/Create';
import { FavoritesPage } from './pages/Favorites';
import { HomePage } from './pages/Home';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { NotificationsPage } from './pages/Notifications';
import { ProfilePage } from './pages/Profile';
import { RatingsPage } from './pages/Ratings';
import { ResultPage } from './pages/Result';
import { SearchPage } from './pages/Search';

const legacyRoutes: Record<string, string> = {
  '/inicio': '/home',
  '/explorar': '/home',
  '/explore': '/home',
  '/resultado': '/results',
  '/entrar': '/login',
  '/cadastrar': '/register',
  '/humor': '/home',
  '/buscar': '/search',
  '/criar': '/create',
  '/avaliacoes': '/ratings',
  '/favoritos': '/favorites',
  '/notificacoes': '/notifications',
  '/perfil': '/profile',
};

export function App() {
  const { pathname: path, search, hash } = useLocation();
  const { modelCity } = useCity();
  const legacy = legacyRoutes[path];
  const focused = path === '/home' || path === '/results';
  const bare = path === '/' || path === '/login' || path === '/register';

  if (legacy) return <Navigate to={`${legacy}${search}${hash}`} replace />;
  if (modelCity && path !== '/' && !bare) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      {bare ? null : <SiteMenu />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<CityGate />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/results" element={<ResultPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<GuideShell />}>
            <Route path="/search" element={<SearchPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/ratings" element={<RatingsPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </div>
      {focused || bare ? null : <SiteFooter />}
    </div>
  );
}
