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

/** "2–0" (con guion, en-dash o em-dash) -> [2, 0]. null si no hay resultado. */
export function parseScore(s: string | undefined | null): [number, number] | null {
	const m = /^(\d+)\s*[–—-]\s*(\d+)$/.exec((s ?? '').trim());
	return m ? [Number(m[1]), Number(m[2])] : null;
}

export function toMatch(f: ApiFixture): Match {
	const score = parseScore(f.score);
	return {
		id: String(f.game_id || `${f.date ?? ''}|${f.home_team ?? ''}|${f.away_team ?? ''}`),
		league: String(f.league ?? 'La Liga'),
		date: String(f.date ?? ''),
		time: f.time ?? '',
		home: f.home_team,
		away: f.away_team,
		homeShort: shortName(f.home_team ?? ''),
		awayShort: shortName(f.away_team ?? ''),
		homeColor: '#1554a0',
		awayColor: '#e72c45',
		status: score ? 'finished' : 'upcoming',
		score: score ?? undefined,
		venue: f.venue ?? ''
	};
}

/** Dedupe por game_id (o fecha|local|visitante si el futuro aun no tiene id)
 *  + sort por hora + map a Match. */
export function toUniqueMatches(rows: ApiFixture[]): Match[] {
	const seen = new Map<string, ApiFixture>();
	for (const f of rows) {
		const key = f?.game_id || `${f?.date}|${f?.home_team}|${f?.away_team}`;
		if (key && !seen.has(key)) seen.set(key, f);
	}
	return [...seen.values()]
		.sort((a, b) => String(a.time ?? '').localeCompare(String(b.time ?? '')))
		.map(toMatch);
}

export function todayISO(d = new Date()): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
