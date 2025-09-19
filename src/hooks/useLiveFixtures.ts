import { useEffect, useState } from "react";

type Team = { name: string };
type Fixture = {
  fixture: { id: number; status: { short: string; elapsed: number | null } };
  teams: { home: Team; away: Team };
  goals: { home: number | null; away: number | null };
};

type ProviderConfig = {
  base: string;
  headers: Record<string, string>;
};

function getConfig(): ProviderConfig {
  const key = import.meta.env.VITE_AF_KEY as string;
  const provider = (import.meta.env.VITE_AF_PROVIDER as string) || "rapid";

  if (!key) throw new Error("VITE_AF_KEY is missing");

  if (provider === "apisports") {
    // Direct API-Sports
    return {
      base: "https://v3.football.api-sports.io",
      headers: { "x-apisports-key": key },
    };
  }

  // Default: RapidAPI
  return {
    base: "https://api-football-v1.p.rapidapi.com",
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
    },
  };
}

export function useLiveFixtures(params: { league?: number; season?: number } = {}) {
  const [data, setData] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { base, headers } = getConfig();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchLive = async () => {
      try {
        const q = new URLSearchParams({ live: "all" });
        if (params.league) q.set("league", String(params.league));
        if (params.season) q.set("season", String(params.season));

        const res = await fetch(`${base}/v3/fixtures?${q.toString()}`, { headers });
        if (!res.ok) throw new Error(`API ${res.status}`);

        const json = await res.json();
        setData(json?.response ?? []);
        setError(null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setLoading(false);
        // Poll ανά 10s
        timer = setTimeout(fetchLive, 10_000);
      }
    };

    fetchLive();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [params.league, params.season]);

  return { data, loading, error };
}
