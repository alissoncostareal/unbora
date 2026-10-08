import { useSearchParams } from 'react-router-dom';

import { MoodGuide } from '../components/MoodGuide';

export function HumorPage() {
  const [params] = useSearchParams();
  return <MoodGuide key={params.get('mood') ?? 'inicio'} />;
}
