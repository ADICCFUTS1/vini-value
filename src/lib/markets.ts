/** Etiquetas amigables + color por mercado (SoT, Sh, ...). */
export const MARKET_LABELS: Record<string, string> = {
	SoT: 'Tiros al arco',
	Sh: 'Tiros',
	Gls: 'Goles',
	Ast: 'Asistencias',
	Crs: 'Centros',
	TklW: 'Entradas ganadas',
	Fls: 'Faltas cometidas',
	Fld: 'Faltas recibidas',
	CrdY: 'Amarilla'
};

export const MARKET_COLORS: Record<string, string> = {
	SoT: '#b8f36b',
	Sh: '#60a5fa',
	Gls: '#f472b6',
	Ast: '#fbbf24',
	Crs: '#22d3ee',
	TklW: '#a78bfa',
	Fls: '#fb923c',
	Fld: '#94a3b8',
	CrdY: '#facc15'
};

export function marketLabel(m: string, fallback?: string): string {
	if (!m) return fallback ?? '';
	return MARKET_LABELS[m] ?? fallback ?? m;
}

export function marketColor(m: string): string {
	return MARKET_COLORS[m] ?? '#b8f36b';
}

export function initials(name: string): string {
	const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return '?';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function probPct(p: any): number {
	if (p?.probabilidad_pct != null) return Number(p.probabilidad_pct);
	const v = p?.prob_calibrada ?? p?.prob_calculada ?? 0;
	return Math.round(Number(v) * 100);
}
