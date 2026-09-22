<script lang="ts">
  import { onMount } from 'svelte';
  import MatchCard from '$lib/MatchCard.svelte';
  import type { Match } from '$lib/matches';
  import { fetchFixturesByDate, fetchDates } from '$lib/api';
  import { ligaName, toUniqueMatches, todayISO } from '$lib/fixtures';

  const fecha = todayISO();
  let items = $state<Match[]>([]);
  let loading = $state(true);
  let error = $state('');
  let liga = $state('Todas');
  let shownDate = $state(fecha);
  let nextDate = $state('');

  let ligas = $derived(['Todas', ...new Set(items.map((m) => m.league))]);
  let visible = $derived(liga === 'Todas' ? items : items.filter((m) => m.league === liga));

  async function load(d: string) {
    loading = true;
    error = '';
    shownDate = d;
    nextDate = '';
    try {
      items = toUniqueMatches(await fetchFixturesByDate(d, 100));
    } catch {
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

<svelte:head><title>Fixture del día {shownDate} | Cancha</title></svelte:head>

<main class="page-shell">
  <div class="app-header"><div class="app-header-inner">
    <div><div class="display app-title">FIXTURE DEL DÍA</div><p class="app-sub">{shownDate}</p></div>
  </div></div>
  <div class="container">
  {#if loading}<p class="muted">Cargando {shownDate}…</p>
  {:else if error}<p class="muted">{error}</p>
  {:else if !items.length}
    <p class="muted">Hoy no hay partidos ({shownDate}).</p>
    {#if nextDate}<button class="cta" onclick={() => load(nextDate)}>Ver próxima fecha: {nextDate}</button>{/if}
    <p class="muted">Ver cuotas y picks en <a class="link-more" href={`/mercados?fecha=${shownDate}`}>Mercados →</a></p>
  {:else}
    <div class="section-heading"><h2 class="display">{visible.length} partidos</h2><span>{shownDate}</span></div>
    <nav class="filters" aria-label="Filtrar liga">{#each ligas as l}<button class:active={liga === l} aria-pressed={liga === l} onclick={() => (liga = l)}>{ligaName(l)}</button>{/each}</nav>
    <div class="cards">{#each visible as match}<MatchCard {match} href={null} />{/each}</div>
  {/if}
  </div>
</main>

<style>
  .muted { margin: 14px 0; }
  .cta { margin-top: 10px; }
</style>
