import type { Match } from './matches';
import type { ApiFixture } from './api';

export function shortName(n: string): string {
	return (n ?? '').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '???';
}

export function ligaName(l: string): string {
	if (l === 'ESP-La Liga') return 'La Liga';
	if (l === 'ENG-Premier League') return 'Premier';
	return l;
}

export function toMatch(f: ApiFixture): Match {
	return {
		id: String(f.game_id),
		league: String(f.league ?? 'La Liga'),
		date: String(f.date ?? ''),
		time: f.time ?? '',
		home: f.home_team,
		away: f.away_team,
		homeShort: shortName(f.home_team ?? ''),
		awayShort: shortName(f.away_team ?? ''),
		homeColor: '#1554a0',
		awayColor: '#e72c45',
		status: 'upcoming',
		venue: f.venue ?? ''
	};
}

/** Dedupe por game_id + sort por hora + map a Match. */
export function toUniqueMatches(rows: ApiFixture[]): Match[] {
	const seen = new Map<string, ApiFixture>();
	for (const f of rows) {
		if (f?.game_id && !seen.has(f.game_id)) seen.set(f.game_id, f);
	}
	return [...seen.values()]
		.sort((a, b) => String(a.time ?? '').localeCompare(String(b.time ?? '')))
		.map(toMatch);
}

export function todayISO(d = new Date()): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
