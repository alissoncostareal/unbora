import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { createEvent } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCity } from '../lib/city';

const categories = ['Shows', 'Gastronomia', 'Festas', 'Cultura', 'Esportes', 'Feiras', 'Outros'];

export function CreatePage() {
  const { user } = useAuth();
  const { city, region, modelCity } = useCity();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-3xl font-semibold">Criar evento</h1>
        <p className="text-muted">Entre na sua conta para enviar um evento. Ele aparece na cidade depois da aprovação.</p>
        <Link to="/login" className="inline-flex h-11 items-center bg-coral px-5 text-sm font-medium text-white">
          Entrar
        </Link>
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const parsed = new Date(startsAt);
      if (Number.isNaN(parsed.getTime())) throw new Error('Informe data e hora.');
      if (modelCity) throw new Error('Escolha a sua cidade antes de enviar.');
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        venue: venue.trim(),
        startsAt: parsed.toISOString(),
        merchantId: user!.id,
        category,
        city,
        region: region.trim() || city,
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar o evento');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <h1 className="text-3xl font-semibold">Evento enviado</h1>
        <p className="text-muted">Ele fica pendente até a aprovação no admin.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold">Criar evento</h1>
      <input className="w-full border border-black/10 bg-white px-4 py-3" placeholder="Título" value={title} onChange={(event) => setTitle(event.target.value)} required />
      <textarea className="min-h-28 w-full border border-black/10 bg-white px-4 py-3" placeholder="Descrição" value={description} onChange={(event) => setDescription(event.target.value)} required />
      <input className="w-full border border-black/10 bg-white px-4 py-3" placeholder="Lugar" value={venue} onChange={(event) => setVenue(event.target.value)} />
      <input className="w-full border border-black/10 bg-white px-4 py-3" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required />
      <select className="w-full border border-black/10 bg-white px-4 py-3" value={category} onChange={(event) => setCategory(event.target.value)}>
        {categories.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      <button type="submit" className="h-11 bg-ink px-5 text-sm font-medium text-white disabled:opacity-60" disabled={loading}>
        {loading ? 'Enviando' : 'Enviar evento'}
      </button>
    </form>
  );
}
