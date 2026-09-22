<script lang="ts">
  import { onMount } from 'svelte';
  import MatchCard from '$lib/MatchCard.svelte';
  import type { Match } from '$lib/matches';
  import { fetchFixturesByDate, fetchDates } from '$lib/api';

  const _t = new Date();
  const fecha = `${_t.getFullYear()}-${String(_t.getMonth() + 1).padStart(2, '0')}-${String(_t.getDate()).padStart(2, '0')}`;
  let items = $state<Match[]>([]);
  let loading = $state(true);
  let error = $state('');
  let liga = $state('Todas');
  let shownDate = $state(fecha);
  let nextDate = $state('');

  const short = (n: string) => (n ?? '').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '???';
  const ligaName = (l: string) => l === 'ESP-La Liga' ? 'La Liga' : l === 'ENG-Premier League' ? 'Premier' : l;
  let ligas = $derived(['Todas', ...new Set(items.map((m) => m.league))]);
  let visible = $derived(liga === 'Todas' ? items : items.filter((m) => m.league === liga));

  async function load(d: string) {
    loading = true;
    error = '';
    shownDate = d;
    nextDate = '';
    try {
      const rows = await fetchFixturesByDate(d, 100);
      const seen = new Map();
      for (const f of rows) {
        if (f.game_id && !seen.has(f.game_id)) seen.set(f.game_id, f);
      }
      items = [...seen.values()]
        .sort((a, b) => String(a.time ?? '').localeCompare(String(b.time ?? '')))
        .map((f: any) => ({
        id: String(f.game_id),
        league: String(f.league ?? 'La Liga'),
        date: String(f.date),
        time: f.time ?? '',
        home: f.home_team,
        away: f.away_team,
        homeShort: short(f.home_team ?? ''),
        awayShort: short(f.away_team ?? ''),
        homeColor: '#1554a0',
        awayColor: '#e72c45',
        status: 'upcoming' as const,
        venue: f.venue ?? ''
      }));
    } catch (e) {
      error = 'API no disponible.';
      items = [];
    } finally {
      loading = false;
    }
    if (!items.length && !error) {
      const dates = await fetchDates();
      nextDate = dates.find((x) => x > d) ?? '';
    }
  }

  onMount(() => load(fecha));
</script>

<main class="page-shell"><div class="container">
  <header class="header">
    <!-- <a class="back" href="/">←</a> -->
    <span class="display header-title">FIXTURE DEL DÍA</span><span class="header-spacer"></span></header>
  {#if loading}<p class="muted">Cargando {shownDate}…</p>
  {:else if error}<p class="muted">{error}</p>
  {:else if !items.length}
    <p class="muted">Hoy no hay partidos ({shownDate}).</p>
    {#if nextDate}<button class="cta" onclick={() => load(nextDate)}>Ver próxima fecha: {nextDate}</button>{/if}
    <p class="muted">Ver cuotas y picks en <a href={`/mercados?fecha=${shownDate}`}>/mercados</a></p>
  {:else}<p class="muted">{visible.length} partidos el {shownDate}</p>
    <nav class="filters" aria-label="Filtrar liga">{#each ligas as l}<button class:active={liga === l} onclick={() => (liga = l)}>{ligaName(l)}</button>{/each}</nav>
    <div class="cards">{#each visible as match}<MatchCard {match} href={null} />{/each}</div>
    <p class="muted">Ver cuotas y picks en <a href={`/mercados?fecha=${shownDate}`}>/mercados</a></p>
  {/if}
</div></main>

<style>
  .header { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; }
  .back { text-decoration: none; font-size: 20px; }
  .header-title { font-size: 13px; letter-spacing: 0.12em; }
  .header-spacer { width: 24px; }
  .filters { display: flex; gap: 8px; margin: 10px 0 14px; }
  .filters button { border: 1px solid #293140; color: #8a95a8; background: transparent; border-radius: 99px; padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer; }
  .filters button.active { color: #0b0d12; background: #b8f36b; border-color: #b8f36b; }
  .cards { display: flex; flex-direction: column; gap: 12px; }
  .muted { color: #778196; font-size: 12px; }
  .cta { margin-top: 8px; border: 1px solid #b8f36b; color: #0b0d12; background: #b8f36b; border-radius: 99px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }
</style>
