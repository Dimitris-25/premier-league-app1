export type Match = {
  fixture_id: number;
  date: string;
  league: { name: string };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number; away: number };
};
