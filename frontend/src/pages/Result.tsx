import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { PlaceCard } from '../components/PlaceCard';
import type { Recommendation } from '../lib/api';

export function ResultPage() {
  const [result, setResult] = useState<Recommendation | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('unbora-result');
    if (!raw) return;
    setResult(JSON.parse(raw) as Recommendation);
  }, []);

  if (!result) {
    return (
      <div>
        <p>Nenhuma busca ainda.</p>
        <Link to="/humor">Começar pelo humor</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>{result.title}</h1>
      <p className="lede">{result.subtitle}</p>
      <div className="grid">
        {result.places.map((place) => (
          <PlaceCard key={`${place.name}-${place.address ?? ''}`} place={place} />
        ))}
      </div>
    </div>
  );
}
