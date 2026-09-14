import { cn } from '@/lib/cn';

export function DataTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border bg-canvas/80 text-left">{children}</tr>
    </thead>
  );
}

export function DataTableHeaderCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        'px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function DataTableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        'border-b border-border transition hover:bg-canvas/60',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={cn('px-6 py-4 align-middle text-sm text-muted', className)} colSpan={colSpan}>
      {children}
    </td>
  );
}

export function DataTableEmpty({ children, colSpan }: { children: React.ReactNode; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-10 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}

export function DataTableLoading({ children }: { children: React.ReactNode }) {
  return <p className="px-6 py-8 text-sm text-muted">{children}</p>;
}
