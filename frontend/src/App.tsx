import { Link, Route, Routes } from 'react-router-dom';

import { HomePage } from './pages/Home';
import { HumorPage } from './pages/Humor';
import { ResultPage } from './pages/Result';
import { SearchPage } from './pages/Search';

export function App() {
  return (
    <div className="shell">
      <header className="top">
        <Link className="brand" to="/">Unbora</Link>
        <nav className="nav">
          <Link to="/humor">Pelo humor</Link>
          <Link to="/buscar">Buscar</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/humor" element={<HumorPage />} />
        <Route path="/buscar" element={<SearchPage />} />
        <Route path="/resultado" element={<ResultPage />} />
      </Routes>
    </div>
  );
}
