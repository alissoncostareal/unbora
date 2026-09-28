export function UnboraMark({
  className = 'size-8',
  variant = 'light',
}: {
  className?: string;
  /** light = for dark backgrounds; dark = for light backgrounds */
  variant?: 'light' | 'dark';
}) {
  const secondary = variant === 'light' ? 'white' : '#1a1a1a';
  const secondaryOpacity = variant === 'light' ? 0.9 : 0.12;
  const tertiaryOpacity = variant === 'light' ? 0.45 : 0.08;

  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect x="2" y="2" width="11" height="11" rx="2" fill="#d4ff4d" />
      <rect
        x="15"
        y="2"
        width="11"
        height="11"
        rx="2"
        fill={secondary}
        fillOpacity={secondaryOpacity}
      />
      <rect
        x="2"
        y="15"
        width="11"
        height="11"
        rx="2"
        fill={secondary}
        fillOpacity={tertiaryOpacity}
      />
      <rect x="15" y="15" width="11" height="11" rx="2" fill="#d4ff4d" fillOpacity="0.55" />
    </svg>
  );
}
