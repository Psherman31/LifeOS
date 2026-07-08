import { prisma } from "@/lib/db";
import { LedgerAdd } from "@/components/ledger-add";
import { ExportButton } from "@/components/export-button";

export const dynamic = "force-dynamic";

// The only record that matters. An evidence base, not a completion log.
export default async function LedgerPage() {
  const entries = await prisma.valuesLedgerEntry.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <main className="flex flex-col gap-4">
      <header>
        <h1 className="ritual-heading">The values ledger</h1>
        <p className="mt-1 text-sm text-soft">
          Things you did that took courage or expressed something you care about. This is the only
          score being kept — and gaps don't erase it.
        </p>
      </header>

      <LedgerAdd />

      <section className="flex flex-col gap-2">
        {entries.length === 0 && (
          <p className="text-sm text-soft">
            Empty so far — it fills up through evening reviews. The first entry usually arrives
            sooner than you'd think.
          </p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="card py-3">
            <p className="text-[15px]">{e.description}</p>
            <p className="mt-1 text-xs text-soft">
              {e.date}
              {e.value && <span className="chip ml-2 align-middle">{e.value}</span>}
              {e.wasFlagged && (
                <span className="chip-muted ml-1.5 align-middle">was dreading it</span>
              )}
            </p>
            {e.note && <p className="mt-1 text-sm text-soft">{e.note}</p>}
          </div>
        ))}
      </section>

      <footer className="mt-2 border-t border-line pt-4">
        <ExportButton />
        <p className="mt-1.5 text-xs text-soft">
          Everything you've captured — tasks, stresses, this ledger, conversations — as one file.
          Worth doing once a month; your data otherwise lives in only one place.
        </p>
      </footer>
    </main>
  );
}
