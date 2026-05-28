type BadgeProps = {
  children: React.ReactNode;
};

export function Badge({ children }: BadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
      {children}
    </span>
  );
}
