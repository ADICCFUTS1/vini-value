// Modo 'live' = Flask http://<host>:5000 · Modo 'static' = JSON en /api/*.json.
// Default: live solo en dev local (http); en build prod o página https siempre static
// (el browser bloquea http://host:5000 desde https por contenido mixto).
// Override con VITE_API_MODE o ?api=live|static.
// El modo SIEMPRE se resuelve en runtime (effectiveMode()) y SSR-safe: nada lee
// window a nivel módulo (evita hydration mismatch y romper el prerender).
import { browser } from '$app/environment';

export type ApiMode = 'live' | 'static';

const _env = import.meta.env.VITE_API_MODE as ApiMode | '' | undefined;
// '' (variable vacía en Vercel) se trata como no definida: ?? no filtra strings vacíos
const ENV_MODE: ApiMode | undefined = _env === 'live' || _env === 'static' ? _env : undefined;

const STATIC_BASE = import.meta.env.VITE_STATIC_BASE ?? '';

export function apiBase(): string {
	const host = browser ? window.location.hostname : 'localhost';
	return `http://${host}:5000`;
}

function baseMode(): ApiMode {
	if (ENV_MODE) return ENV_MODE;
	if (import.meta.env.PROD) return 'static';
	if (browser && window.location.protocol === 'https:') return 'static';
	return 'live';
}

function queryOverride(): ApiMode | null {
	if (!browser) return null;
	try {
		const v = new URLSearchParams(window.location.search).get('api');
		return v === 'live' || v === 'static' ? v : null;
	} catch {
		return null;
	}
}

/** Llamar en runtime (dentro de load/onMount), no a nivel módulo, para evitar hydration mismatch. */
export function effectiveMode(): ApiMode {
	return queryOverride() ?? baseMode();
}

export type ApiFixture = {
	game_id: string;
	date: string;
	home_team: string;
	away_team: string;
	picks_count?: number;
	time?: string;
	venue?: string;
	league?: string;
	// campos del fixture completo (fixture_diario / fixtures-full-*.json)
	score?: string;
	season?: string;
	week?: string;
	day?: string;
	attendance?: string;
	referee?: string;
	match_report?: string;
	notes?: string;
	comp_id?: string;
	country?: string;
};

export type LineupRow = {
	game_id: string;
	team: string;
	player: string;
	jersey_number?: number;
	position?: string;
	is_starter?: number;
	minutes_played?: number;
};

function safeSlice<T>(v: unknown, limit: number, fallback: T[] = []): T[] {
	if (!Array.isArray(v)) return fallback;
	return (v as T[]).slice(0, limit);
}

// En static un error se ve igual a "no hay datos" para la UI, pero queda logueado.
async function getJSON<T = unknown>(url: string, fallback: T): Promise<T> {
	try {
		const res = await fetch(url);
		if (!res.ok) {
			console.warn(`[api] ${url} -> HTTP ${res.status}`);
			return fallback;
		}
		return (await res.json()) as T;
	} catch (e) {
		console.warn(`[api] ${url} fallo:`, e);
		return fallback;
	}
}

async function getLive(url: string): Promise<unknown> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`API ${res.status}`);
	return res.json();
}

export async function fetchFixturesByDate(fecha: string, limit = 100): Promise<ApiFixture[]> {
	if (effectiveMode() === 'static')
		return safeSlice(await getJSON(`${STATIC_BASE}/api/fixtures-${fecha}.json`, []), limit);
	return safeSlice(await getLive(`${apiBase()}/fixtures?fecha=${fecha}&limit=${limit}`), limit);
}

/** Fixture diario 100% (todas las competencias): static fixtures-full-<fecha>.json
 *  o live /fixtures-full. Reutiliza el mismo shape que los fixtures normales. */
export async function fetchFixturesFullByDate(fecha: string, limit = 1000): Promise<ApiFixture[]> {
	if (effectiveMode() === 'static')
		return safeSlice(await getJSON(`${STATIC_BASE}/api/fixtures-full-${fecha}.json`, []), limit);
	return safeSlice(await getLive(`${apiBase()}/fixtures-full?fecha=${fecha}&limit=${limit}`), limit);
}

/** Fechas con fixture completo descargado (solo static; live retorna []). */
export async function fetchDatesFull(): Promise<string[]> {
	if (effectiveMode() === 'static') {
		const v = await getJSON(`${STATIC_BASE}/api/dates-full.json`, [] as string[]);
		return Array.isArray(v) ? v : [];
	}
	return [];
}

export async function fetchPicksByDate(fecha: string, limit = 5000): Promise<any[]> {
	if (effectiveMode() === 'static')
		return safeSlice(await getJSON(`${STATIC_BASE}/api/picks-${fecha}.json`, []), limit);
	return safeSlice(await getLive(`${apiBase()}/picks?fecha=${fecha}&limit=${limit}`), limit);
}

export async function fetchPicksByGame(game_id: string, limit = 500): Promise<any[]> {
	if (effectiveMode() === 'static')
		return safeSlice(await getJSON(`${STATIC_BASE}/api/game-${game_id}.json`, []), limit);
	return safeSlice(
		await getLive(`${apiBase()}/picks?game_id=${encodeURIComponent(game_id)}&limit=${limit}`),
		limit
	);
}

export async function fetchFixture(game_id: string): Promise<any> {
	if (effectiveMode() === 'static')
		return getJSON(`${STATIC_BASE}/api/fixture-${game_id}.json`, null);
	try {
		return await getLive(`${apiBase()}/fixture/${encodeURIComponent(game_id)}`);
	} catch {
		return null;
	}
}

export async function fetchDates(): Promise<string[]> {
	if (effectiveMode() === 'static') {
		const v = await getJSON(`${STATIC_BASE}/api/dates.json`, [] as string[]);
		return Array.isArray(v) ? v : [];
	}
	// En live el backend no expone /dates: se retorna [] y la UI lo maneja.
	return [];
}

/**
 * Fecha de referencia del export (today.json). En static es la fuente de verdad para
 * "hoy": todos los visitantes ven la misma fecha, no la del reloj de cada navegador.
 * En live no existe -> null y la UI cae al reloj local.
 */
export async function fetchToday(): Promise<string | null> {
	if (effectiveMode() !== 'static') return null;
	const v = await getJSON<{ date?: string }>(`${STATIC_BASE}/api/today.json`, {});
	return v?.date ?? null;
}

/** Formaciones: opcional, nunca tira (retorna [] si no hay dato). */
export async function fetchLineup(game_id: string): Promise<LineupRow[]> {
	if (effectiveMode() === 'static')
		return safeSlice<LineupRow>(
			await getJSON(`${STATIC_BASE}/api/lineup-${game_id}.json`, []),
			200
		);
	try {
		return safeSlice<LineupRow>(
			await getLive(`${apiBase()}/lineups?game_id=${encodeURIComponent(game_id)}`),
			200
		);
	} catch {
		return [];
	}
}
