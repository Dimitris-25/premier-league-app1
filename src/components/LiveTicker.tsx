import { useEffect, useState } from "react";
import { getLiveFixtures, type Fixture } from "../aff"; // προσαρμόσε το path αν χρειαστεί

export default function LiveTicker() {
  const [data, setData] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;

    const tick = async (): Promise<void> => {
      try {
        // Η getLiveFixtures στο aff.ts επιστρέφει Fixture[] χωρίς παραμέτρους
        const res = await getLiveFixtures();
        setData(res);
        setError(null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setLoading(false);
        t = setTimeout(() => {
          // επόμενος κύκλος
          void tick();
        }, 10_000);
      }
    };

    void tick();


    return () => {
      if (t) clearTimeout(t);
    };
  }, []);

  if (loading) return <div>Loading live…</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!data.length) return <div>No live matches now</div>;

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {data.map((m: Fixture) => (
        <div key={m.fixture.id} className="rounded border p-3">
          <div className="text-sm opacity-70">
            {m.fixture.status.short} · {m.fixture.status.elapsed ?? 0}'
          </div>
          <div className="text-lg font-medium">
            {m.teams.home.name} {m.goals.home ?? 0} – {m.goals.away ?? 0} {m.teams.away.name}
          </div>
        </div>
      ))}
    </div>
  );
}
