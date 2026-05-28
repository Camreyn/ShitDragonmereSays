import Link from "next/link";

const links = [
  ["/episodes", "Episodes"],
  ["/quotes", "Quotes"],
  ["/search", "Search"],
  ["/admin/import", "Admin"],
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:rgba(7,8,10,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-black uppercase tracking-[0.24em] text-[var(--accent)]">
          Shit Dragonmere Says
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="transition hover:text-[var(--text)]">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
