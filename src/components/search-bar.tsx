import Link from "next/link";

type SearchBarProps = {
  defaultValue?: string;
};

export function SearchBar({ defaultValue }: SearchBarProps) {
  return (
    <form action="/search" className="grid gap-3 md:grid-cols-[1fr_auto]">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder='Search lines, guests, exact phrases like "corn futures", or tags'
        className="h-14 rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] px-5 text-base outline-none transition focus:border-[var(--accent)]"
      />
      <div className="flex gap-3">
        <button className="h-14 rounded-2xl bg-[var(--accent)] px-6 font-semibold text-[var(--accent-ink)] transition hover:brightness-110">
          Search
        </button>
        <Link
          href="/episodes"
          className="inline-flex h-14 items-center rounded-2xl border border-[var(--line)] px-5 font-semibold text-[var(--text)] transition hover:border-[var(--accent)]"
        >
          Browse
        </Link>
      </div>
    </form>
  );
}
