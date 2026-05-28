import { QuoteCard } from "@/components/quote-card";
import { SectionCard } from "@/components/section-card";
import { getQuotes } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await getQuotes();
  return (
    <SectionCard title="Quotes">
      <div className="grid gap-4">
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </div>
    </SectionCard>
  );
}
