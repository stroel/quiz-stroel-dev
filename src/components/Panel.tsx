import type { ReactNode } from 'react';

/** A framed section with a grey title bar; the building block of every quiz screen. */
export default function Panel({
  title,
  action,
  children,
}: {
  title: string;
  /** Optional control at the right end of the title bar. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-stone-200 bg-stone-100 px-4">
        <h2 className="text-sm font-semibold text-stone-600">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
