export const homeSections = [
  { id: 'intencao', label: 'Curadoria' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'destaques', label: 'Atmosferas' },
  { id: 'perspectivas', label: 'Perspectivas' },
  { id: 'numeros', label: 'Números' },
] as const;

const DURATION = 1200;

let frame = 0;

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;

  const header = document.querySelector('header');
  const headerHeight = header?.getBoundingClientRect().height ?? 0;
  const top = window.scrollY + el.getBoundingClientRect().top;
  const height = el.getBoundingClientRect().height;
  const view = window.innerHeight;
  const room = Math.max(view - headerHeight, 1);
  const centered = top + height / 2 - (headerHeight + room / 2);
  const max = Math.max(0, document.documentElement.scrollHeight - view);
  const target = Math.min(Math.max(0, centered), max);
  const start = window.scrollY;
  const distance = target - start;

  cancelAnimationFrame(frame);
  if (Math.abs(distance) < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, target);
    return true;
  }

  const started = performance.now();
  const step = (now: number) => {
    const progress = Math.min(1, (now - started) / DURATION);
    window.scrollTo(0, start + distance * ease(progress));
    if (progress < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return true;
}

export function goToSection(id: string) {
  window.dispatchEvent(new CustomEvent('unbora-section', { detail: id }));
}
