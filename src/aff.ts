// ----------------- Types -----------------
export type Fixture = {
  fixture: {
    id: number;
    status: { short: string; elapsed: number | null };
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

export type FixtureEvent = {
  time: { elapsed: number; extra?: number | null };
  team: { id: number; name: string; logo: string };
  player?: { id: number; name: string } | null;
  assist?: { id: number; name: string } | null;
  type: string;
  detail: string;
  comments?: string | null;
};

type Provider = "rapid" | "apisports";
type ProviderConfig = { base: string; headers: Record<string, string> };

// ----------------- CONFIG -----------------
// ⚠️ Hardcoded API key (φαίνεται στο build – μόνο για dev/demo!)
const KEY: string = "dfbd82d5896cf42f559ff878e6511d8a";
const PROV: Provider = "apisports"; // ή "rapid"

// ----------------- Provider setup -----------------
function cfg(): ProviderConfig {
  if (!KEY) throw new Error("API key missing");

  if (PROV === "apisports") {
    return {
      base: "https://v3.football.api-sports.io",
      headers: { "x-apisports-key": KEY },
    };
  }

  // Default: RapidAPI
  return {
    base: "https://api-football-v1.p.rapidapi.com",
    headers: {
      "X-RapidAPI-Key": KEY,
      "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
    },
  };
}

// ----------------- Generic fetch wrapper -----------------
export async function afGet<T>(
  path: string,
  search?: Record<string, string>
): Promise<T> {
  const { base, headers } = cfg();

  const url = new URL(`${base}${path}`);
  if (search) {
    Object.entries(search).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return (await res.json()) as T;
}

// ----------------- API Helpers -----------------
// Get live fixtures
export async function getLiveFixtures(): Promise<Fixture[]> {
  const data = await afGet<{ response: Fixture[] }>("/fixtures", {
    live: "all",
  });
  return data.response;
}

// Get events for a specific fixture
export async function getFixtureEvents(
  fixtureId: number
): Promise<FixtureEvent[]> {
  const data = await afGet<{ response: FixtureEvent[] }>("/fixtures/events", {
    fixture: String(fixtureId),
  });
  return data.response;
}
