// Modo 'live' = Flask http://<host>:5000 · Modo 'static' = JSON en /api/*.json.
// Default: live solo en dev local (http); en build prod o página https siempre static
// (el browser bloquea http://host:5000 desde https por contenido mixto).
// Override solo con VITE_API_MODE.
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
export const API_BASE = `http://${host}:5000`;
const _env = import.meta.env.VITE_API_MODE as 'live' | 'static' | '' | undefined;
// '' (variable vacía en Vercel) se trata como no definida: ?? no filtra strings vacíos
const ENV_MODE: 'live' | 'static' | undefined = _env === 'live' || _env === 'static' ? _env : undefined;
export const MODE: 'live' | 'static' = ENV_MODE ?? (import.meta.env.PROD || isHttps ? 'static' : 'live');
const STATIC_BASE = import.meta.env.VITE_STATIC_BASE ?? '';

// Override manual para debug: ?api=live | ?api=static
function queryOverride(): 'live' | 'static' | null {
	try {
		const v = new URLSearchParams(window.location.search).get('api');
		return v === 'live' || v === 'static' ? v : null;
	} catch {
		return null;
	}
}
export const EFFECTIVE_MODE: 'live' | 'static' =
	typeof window !== 'undefined' ? (queryOverride() ?? MODE) : MODE;
if (typeof window !== 'undefined') console.info(`[api] mode=${EFFECTIVE_MODE} (base=${MODE})`);

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

async function getJSON(url: string, fallback: any = []) {
	const res = await fetch(url);
	if (!res.ok) return fallback;
	return res.json();
}

export async function fetchFixtures(limit = 20): Promise<ApiFixture[]> {
	if (EFFECTIVE_MODE === 'static') return getJSON(`${STATIC_BASE}/api/fixtures.json`).then((r) => r.slice(0, limit));
	const res = await fetch(`${API_BASE}/fixtures?limit=${limit}`);
	if (!res.ok) throw new Error(`API ${res.status}`);
	return res.json();
}

export async function fetchFixturesByDate(fecha: string, limit = 100): Promise<ApiFixture[]> {
	if (EFFECTIVE_MODE === 'static') return getJSON(`${STATIC_BASE}/api/fixtures-${fecha}.json`).then((r) => r.slice(0, limit));
	const res = await fetch(`${API_BASE}/fixtures?fecha=${fecha}&limit=${limit}`);
	if (!res.ok) throw new Error(`API ${res.status}`);
	return res.json();
}

export async function fetchPicksByDate(fecha: string, limit = 5000): Promise<any[]> {
	if (EFFECTIVE_MODE === 'static') return getJSON(`${STATIC_BASE}/api/picks-${fecha}.json`).then((r) => r.slice(0, limit));
	const res = await fetch(`${API_BASE}/picks?fecha=${fecha}&limit=${limit}`);
	if (!res.ok) throw new Error(`API ${res.status}`);
	return res.json();
}

export async function fetchPicksByGame(game_id: string, limit = 500): Promise<any[]> {
	if (EFFECTIVE_MODE === 'static') return getJSON(`${STATIC_BASE}/api/game-${game_id}.json`).then((r) => r.slice(0, limit));
	const res = await fetch(`${API_BASE}/picks?game_id=${encodeURIComponent(game_id)}&limit=${limit}`);
	if (!res.ok) throw new Error(`API ${res.status}`);
	return res.json();
}

export async function fetchFixture(game_id: string): Promise<any> {
	if (EFFECTIVE_MODE === 'static') return getJSON(`${STATIC_BASE}/api/fixture-${game_id}.json`, null);
	const res = await fetch(`${API_BASE}/fixture/${encodeURIComponent(game_id)}`);
	if (!res.ok) throw new Error(`API ${res.status}`);
	return res.json();
}
