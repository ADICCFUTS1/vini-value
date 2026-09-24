<script lang="ts">
  // Fixture diario 100% (todas las competencias de FBref): mismos componentes que
  // /fixture, pero lee fixtures-full-<fecha>.json (o /fixtures-full en live).
  import { onMount } from 'svelte';
  import MatchCard from '$lib/MatchCard.svelte';
  import type { Match } from '$lib/matches';
  import { fetchFixturesFullByDate, fetchDatesFull, fetchToday } from '$lib/api';
  import { ligaName, toUniqueMatches, todayISO } from '$lib/fixtures';

  const hoy = todayISO();
  let items = $state<Match[]>([]);
  let loading = $state(true);
  let error = $state('');
  let liga = $state('Todas');
  let shownDate = $state(hoy);
  let nextDate = $state('');

  let ligas = $derived(['Todas', ...new Set(items.map((m) => m.league))]);
  let visible = $derived(liga === 'Todas' ? items : items.filter((m) => m.league === liga));

  let seq = 0;
  async function load(d: string) {
    const my = ++seq;
    loading = true;
    error = '';
    shownDate = d;
    nextDate = '';
    try {
      const rows = await fetchFixturesFullByDate(d, 1000);
      if (my !== seq) return;
      items = toUniqueMatches(rows);
    } catch {
      if (my !== seq) return;
      error = 'API no disponible.';
      items = [];
    } finally {
      if (my === seq) loading = false;
    }
    if (!items.length && !error) {
      const dates = await fetchDatesFull();
      if (my !== seq) return;
      nextDate = dates.find((x) => x > d) ?? '';
    }
  }

  onMount(async () => {
    const ref = await fetchToday();
    await load(ref ?? hoy);
  });
</script>

<svelte:head><title>Fixture completo del día {shownDate} | Cancha</title></svelte:head>

<main class="page-shell">
  <div class="app-header"><div class="app-header-inner">
    <div>
      <div class="display app-title">FIXTURE COMPLETO</div>
      <p class="app-sub">{shownDate} · 100% de las competencias · <a class="link-more" href="/fixture">solo ligas principales →</a></p>
    </div>
  </div></div>
  <div class="container">
  {#if loading}<p class="muted">Cargando {shownDate}…</p>
  {:else if error}<p class="muted">{error}</p>
  {:else if !items.length}
    <p class="muted">No hay fixture descargado para {shownDate}. Corre <code>python fixture_diario.py</code> y re-exporta.</p>
    {#if nextDate}<button class="cta" onclick={() => load(nextDate)}>Ver próxima fecha: {nextDate}</button>{/if}
  {:else}
    <div class="section-heading"><h2 class="display">{visible.length} partidos</h2><span>{shownDate}</span></div>
    <nav class="filters" aria-label="Filtrar competencia">{#each ligas as l}<button class:active={liga === l} aria-pressed={liga === l} onclick={() => (liga = l)}>{ligaName(l)}</button>{/each}</nav>
    <div class="cards">{#each visible as match}<MatchCard {match} href={null} />{/each}</div>
  {/if}
  </div>
</main>

<style>
  .muted { margin: 14px 0; }
  .cta { margin-top: 10px; }
  code { background: #1a1d26; padding: 2px 6px; border-radius: 6px; }
</style>
