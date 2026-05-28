type SectionCardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({ title, children, className }: SectionCardProps) {
  return (
    <section className={`rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] ${className ?? ""}`}>
      {title ? <h2 className="mb-4 text-lg font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{title}</h2> : null}
      {children}
    </section>
  );
}
