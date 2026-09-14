import { cn } from '@/lib/cn';

export function PageHeader({
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  if (!description) return null;

  return (
    <header className={cn('mb-6', className)}>
      <p className="max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
    </header>
  );
}
