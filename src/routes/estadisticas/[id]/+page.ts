import ids from '$lib/generated/game-ids.json';
import type { EntryGenerator } from './$types';

// Los ids los genera export_static.py (un json por partido en static/api).
// Con entries, /estadisticas/[id] se prerenderiza como shell estática en vez
// de instanciar una serverless function por visita.
export const entries: EntryGenerator = async () => ids.map((id) => ({ id }));
