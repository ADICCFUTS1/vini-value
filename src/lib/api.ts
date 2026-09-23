// Modo 'live' = Flask http://<host>:5000 · Modo 'static' = JSON en /api/*.json.
// Default: live solo en dev local (http); en build prod o página https siempre static
// (el browser bloquea http://host:5000 desde https por contenido mixto).
// Override solo con VITE_API_MODE o ?api=live|static (solo cliente, para no romper SSR).
import { browser } from '$app/environment';

const host = browser ? window.location.hostname : 'localhost';
export const API_BASE = `http://${host}:5000`;

const _env = import.meta.env.VITE_API_MODE as 'live' | 'static' | '' | undefined;
// '' (variable vacía en Vercel) se trata como no definida: ?? no filtra strings vacíos
const ENV_MODE: 'live' | 'static' | undefined =
	_env === 'live' || _env === 'static' ? _env : undefined;

function baseMode(): 'live' | 'static' {
	if (ENV_MODE) return ENV_MODE;
	if (import.meta.env.PROD) return 'static';
	if (browser && window.location.protocol === 'https:') return 'static';
	return 'live';
}

export const MODE: 'live' | 'static' = baseMode();
const STATIC_BASE = import.meta.env.VITE_STATIC_BASE ?? '';

function queryOverride(): 'live' | 'static' | null {
	if (!browser) return null;
	try {
		const v = new URLSearchParams(window.location.search).get('api');
		return v === 'live' || v === 'static' ? v : null;
	} catch {
		return null;
	}
}

/** Llamar en runtime (dentro de load/onMount), no a nivel módulo, para evitar hydration mismatch. */
export function effectiveMode(): 'live' | 'static' {
	return queryOverride() ?? MODE;
}

/** Compat: valor solo-cliente calculado bajo demanda. */
export const EFFECTIVE_MODE: 'live' | 'static' = MODE;
if (browser) console.info(`[api] mode=${effectiveMode()} (base=${MODE})`);

export type ApiFixture = {
	game_id: string;
	date: string;
	home_team: string;
	away_team: string;
	picks_count?: number;
	time?: string;
	venue?: string;
	league?: string;
};

function safeSlice<T>(v: unknown, limit: number, fallback: T[] = []): T[] {
	if (!Array.isArray(v)) return fallback;
	return (v as T[]).slice(0, limit);
}

async function getJSON(url: string, fallback: any = []) {
	try {
		const res = await fetch(url);
		if (!res.ok) return fallback;
		return await res.json();
	} catch {
		return fallback;
	}
}

export async function fetchFixtures(limit = 20): Promise<ApiFixture[]> {
	if (effectiveMode() === 'static') return safeSlice(await getJSON(`${STATIC_BASE}/api/fixtures.json`), limit);
	const res = await fetch(`${API_BASE}/fixtures?limit=${limit}`);
	if (!res.ok) throw new Error(`API ${res.status}`);
	const data = await res.json();
	return Array.isArray(data) ? data.slice(0, limit) : [];
}

export async function fetchFixturesByDate(fecha: string, limit = 100): Promise<ApiFixture[]> {
	if (effectiveMode() === 'static')
		return safeSlice(await getJSON(`${STATIC_BASE}/api/fixtures-${fecha}.json`), limit);
	const res = await fetch(`${API_BASE}/fixtures?fecha=${fecha}&limit=${limit}`);
	if (!res.ok) throw new Error(`API ${res.status}`);
	const data = await res.json();
	return Array.isArray(data) ? data.slice(0, limit) : [];
}

export async function fetchPicksByDate(fecha: string, limit = 5000): Promise<any[]> {
	if (effectiveMode() === 'static')
		return safeSlice(await getJSON(`${STATIC_BASE}/api/picks-${fecha}.json`), limit);
	const res = await fetch(`${API_BASE}/picks?fecha=${fecha}&limit=${limit}`);
	if (!res.ok) throw new Error(`API ${res.status}`);
	const data = await res.json();
	return Array.isArray(data) ? data.slice(0, limit) : [];
}

export async function fetchPicksByGame(game_id: string, limit = 500): Promise<any[]> {
	if (effectiveMode() === 'static')
		return safeSlice(await getJSON(`${STATIC_BASE}/api/game-${game_id}.json`), limit);
	const res = await fetch(`${API_BASE}/picks?game_id=${encodeURIComponent(game_id)}&limit=${limit}`);
	if (!res.ok) throw new Error(`API ${res.status}`);
	const data = await res.json();
	return Array.isArray(data) ? data.slice(0, limit) : [];
}

export async function fetchFixture(game_id: string): Promise<any> {
	if (effectiveMode() === 'static')
		return getJSON(`${STATIC_BASE}/api/fixture-${game_id}.json`, null);
	const res = await fetch(`${API_BASE}/fixture/${encodeURIComponent(game_id)}`);
	if (!res.ok) throw new Error(`API ${res.status}`);
	return res.json();
}

export async function fetchDates(): Promise<string[]> {
	if (effectiveMode() === 'static') {
		const v = await getJSON(`${STATIC_BASE}/api/dates.json`, []);
		return Array.isArray(v) ? v : [];
	}
	// En live el backend no expone /dates: se retorna [] y la UI lo maneja.
	return [];
}

export async function fetchLineupsByGame(game_id: string): Promise<any[]> {
	if (effectiveMode() === 'static') {
		const v = await getJSON(`${STATIC_BASE}/api/lineup-${game_id}.json`, []);
		return Array.isArray(v) ? v : [];
	}
	const res = await fetch(`${API_BASE}/lineups?game_id=${encodeURIComponent(game_id)}`);
	if (!res.ok) throw new Error(`API ${res.status}`);
	const data = await res.json();
	return Array.isArray(data) ? data : [];
}
