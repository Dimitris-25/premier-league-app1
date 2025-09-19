import LiveTicker from "../components/LiveTicker";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Live games (frontend-only) */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Live matches</h2>
        <LiveTicker />
      </section>

      {/* Υπόλοιπα sections  */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* cards / charts */}
      </section>
    </div>
  );
}
