<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import MatchCard from '$lib/MatchCard.svelte';
  import type { Match } from '$lib/matches';
  import { fetchFixturesByDate, fetchPicksByDate } from '$lib/api';

  const _t = new Date();
  const hoy = `${_t.getFullYear()}-${String(_t.getMonth() + 1).padStart(2, '0')}-${String(_t.getDate()).padStart(2, '0')}`;
  let fecha = $state(page.url.searchParams.get('fecha') ?? hoy);
  let items = $state<Match[]>([]);
  let tops = $state<Record<string, any[]>>({});
  let loading = $state(true);
  let liga = $state('Todas');

  const short = (n: string) => (n ?? '').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '???';
  const ligaName = (l: string) => l === 'ESP-La Liga' ? 'La Liga' : l === 'ENG-Premier League' ? 'Premier' : l;
  let ligas = $derived(['Todas', ...new Set(items.map((m) => m.league))]);
  let visible = $derived(liga === 'Todas' ? items : items.filter((m) => m.league === liga));

  async function load(d: string) {
    loading = true;
    try {
      const [fr, pr] = await Promise.all([fetchFixturesByDate(d, 100), fetchPicksByDate(d, 5000)]);
      const seen = new Map();
      for (const f of fr) if (f.game_id && !seen.has(f.game_id)) seen.set(f.game_id, f);
      items = [...seen.values()]
        .sort((a, b) => String(a.time ?? '').localeCompare(String(b.time ?? '')))
        .map((f: any) => ({
        id: String(f.game_id), league: f.league ?? 'La Liga', date: String(f.date), time: f.time ?? '',
        home: f.home_team, away: f.away_team, homeShort: short(f.home_team), awayShort: short(f.away_team),
        homeColor: '#1554a0', awayColor: '#e72c45', status: 'upcoming' as const, venue: f.venue ?? ''
      }));
      const by: Record<string, any[]> = {};
      for (const p of pr) (by[p.game_id] ??= []).push(p);
      for (const k of Object.keys(by))
        by[k] = by[k].sort((a, b) => (b.prob_calibrada ?? b.prob_calculada ?? 0) - (a.prob_calibrada ?? a.prob_calculada ?? 0)).slice(0, 3);
      tops = by;
    } finally {
      loading = false;
    }
  }

  onMount(() => load(fecha));
</script>

<main class="page-shell"><div class="container">
  <header class="header">
    <!-- <a class="back" href="/fixture">←</a> -->
    <span class="display header-title">MERCADOS</span><span class="header-spacer"></span></header>
  <input type="date" bind:value={fecha} onchange={() => load(fecha)} aria-label="Fecha" />
  {#if loading}<p class="muted">Cargando mercados {fecha}…</p>
  {:else}
    <nav class="filters" aria-label="Filtrar liga">{#each ligas as l}<button class:active={liga === l} onclick={() => (liga = l)}>{ligaName(l)}</button>{/each}</nav>
    <div class="cards">{#each visible as match}
      <MatchCard {match} />
      <div class="top">
        {#each tops[match.id] ?? [] as p}<span>{p.player} {p.mercado} {p.linea} · {Math.round((p.prob_calibrada ?? p.prob_calculada) * 100)}%</span>{:else}<span class="muted">Sin picks</span>{/each}
      </div>
    {/each}</div>
  {/if}
</div></main>

<style>
  .header { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; }
  .back { text-decoration: none; font-size: 20px; }
  .header-title { font-size: 13px; letter-spacing: 0.12em; }
  .header-spacer { width: 24px; }
  input[type='date'] { background: #151922; color: #dce3ef; border: 1px solid #252b38; border-radius: 10px; padding: 8px 10px; margin-bottom: 12px; }
  .filters { display: flex; gap: 8px; margin: 0 0 12px; }
  .filters button { border: 1px solid #293140; color: #8a95a8; background: transparent; border-radius: 99px; padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer; }
  .filters button.active { color: #0b0d12; background: #b8f36b; border-color: #b8f36b; }
  .cards { display: flex; flex-direction: column; gap: 4px; }
  .top { display: flex; gap: 6px; flex-wrap: wrap; margin: 0 0 12px; }
  .top span { font-size: 11px; border: 1px solid #252b38; border-radius: 99px; padding: 4px 10px; color: #dce3ef; }
  .muted { color: #778196; font-size: 12px; }
</style>
