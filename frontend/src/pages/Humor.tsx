import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { activities, feelings, moods } from '../lib/catalog';
import { recommend } from '../lib/api';

export function HumorPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(moods[0]);
  const [feeling, setFeeling] = useState(feelings[0]);
  const [selected, setSelected] = useState<string[]>(['food']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function submit() {
    const chosen = activities.filter((activity) => selected.includes(activity.id));
    if (chosen.length === 0) {
      setError('Escolha pelo menos um tipo de lugar.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await recommend({ humor: mood.value, sentir: feeling.value, activities: chosen });
      sessionStorage.setItem('unbora-result', JSON.stringify(result));
      navigate('/resultado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na recomendação');
      setLoading(false);
    }
  }

  const options = step === 0 ? moods : feelings;
  const current = step === 0 ? mood.label : feeling.label;

  return (
    <div>
      <p className="muted">Passo {step + 1} de 3</p>
      <h1>{step === 0 ? 'Como você está?' : step === 1 ? 'Como quer se sentir?' : 'Que tipo de lugar?'}</h1>
      <div className="grid">
        {step < 2
          ? options.map((option) => (
              <button
                key={option.label}
                type="button"
                className={current === option.label ? 'choice on' : 'choice'}
                onClick={() => (step === 0 ? setMood(option) : setFeeling(option))}
              >
                {option.label}
              </button>
            ))
          : activities.map((activity) => (
              <button
                key={activity.id}
                type="button"
                className={selected.includes(activity.id) ? 'choice on' : 'choice'}
                onClick={() => toggle(activity.id)}
              >
                {activity.label}
              </button>
            ))}
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="actions">
        {step > 0 ? (
          <button type="button" className="btn btn-ghost" onClick={() => setStep((value) => value - 1)}>
            Voltar
          </button>
        ) : null}
        {step < 2 ? (
          <button type="button" className="btn btn-ink" onClick={() => setStep((value) => value + 1)}>
            Continuar
          </button>
        ) : (
          <button type="button" className="btn btn-coral" onClick={submit} disabled={loading}>
            {loading ? 'Buscando lugares' : 'Ver recomendações'}
          </button>
        )}
      </div>
    </div>
  );
}
