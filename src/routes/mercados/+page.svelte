<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import MatchCard from '$lib/MatchCard.svelte';
  import BackButton from '$lib/BackButton.svelte';
  import type { Match } from '$lib/matches';
  import { fetchFixturesByDate, fetchPicksByDate } from '$lib/api';
  import { ligaName, toUniqueMatches, todayISO } from '$lib/fixtures';
  import { marketLabel, marketColor, initials, probPct } from '$lib/markets';

  const hoy = todayISO();
  let fecha = $state(page.url.searchParams.get('fecha') ?? hoy);
  let items = $state<Match[]>([]);
  let tops = $state<Record<string, any[]>>({});
  let loading = $state(true);
  let error = $state('');
  let liga = $state('Todas');
  let limit = $state(10);
  const PAGE = 10;

  let ligas = $derived(['Todas', ...new Set(items.map((m) => m.league))]);
  let visible = $derived(liga === 'Todas' ? items : items.filter((m) => m.league === liga));
  let paginated = $derived(visible.slice(0, limit));
  let remaining = $derived(visible.length - paginated.length);

  async function load(d: string) {
    loading = true;
    error = '';
    limit = PAGE;
    try {
      const [fr, pr] = await Promise.all([fetchFixturesByDate(d, 100), fetchPicksByDate(d, 5000)]);
      items = toUniqueMatches(fr);
      const by: Record<string, any[]> = {};
      for (const p of pr) {
        if (p?.game_id) (by[p.game_id] ??= []).push(p);
      }
      for (const k of Object.keys(by))
        by[k] = by[k].sort((a, b) => (b.prob_calibrada ?? b.prob_calculada ?? 0) - (a.prob_calibrada ?? a.prob_calculada ?? 0)).slice(0, 3);
      tops = by;
    } catch {
      error = 'API no disponible.';
      items = [];
      tops = {};
    } finally {
      loading = false;
    }
  }

  onMount(() => load(fecha));
</script>

<svelte:head><title>Mercados {fecha} | Cancha</title></svelte:head>

<main class="page-shell">
  <div class="app-header"><div class="app-header-inner">
    <div><div class="display app-title">MERCADOS</div><p class="app-sub">{fecha} · top picks por partido</p></div>
    <BackButton fallback="/fixture" />
  </div></div>
  <div class="container">
  <div style="margin:14px 0"><input class="date-input" type="date" bind:value={fecha} onchange={() => load(fecha)} aria-label="Fecha" /></div>
  {#if loading}<p class="muted">Cargando mercados {fecha}…</p>
  {:else if error}<p class="muted">{error}</p>
  {:else}
    <nav class="filters" aria-label="Filtrar liga">{#each ligas as l}<button class:active={liga === l} aria-pressed={liga === l} onclick={() => { liga = l; limit = PAGE; }}>{ligaName(l)}</button>{/each}</nav>
    <p class="muted">Mostrando {paginated.length} de {visible.length} partidos</p>
    <div class="cards">{#each paginated as match}
      <section class="match-section" aria-label={`${match.home} contra ${match.away}`}>
        <MatchCard {match} />
        <div class="props-grid">
          {#each tops[match.id] ?? [] as p}
            {@const pct = probPct(p)}
            {@const ml = p.mercado_label ?? marketLabel(p.mercado)}
            {@const mc = marketColor(p.mercado)}
            <article class="prop">
              <div class="prop-top">
                <span class="avatar" style={`--pill:${mc}`}>{initials(p.player)}</span>
                <div style="min-width:0"><p class="prop-name">{p.player}</p><p class="prop-meta">{p.team} · {ml} {p.linea}</p></div>
              </div>
              <div class="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Probabilidad ${pct}%`}><i style={`width:${pct}%;--pill:${mc}`}></i></div>
              <div class="prop-foot">
                <span class="pill" style={`--pill:${mc}`}>{p.mercado} {p.linea}</span>
                <span class="prob">{pct}%<small>PROB</small></span>
              </div>
            </article>
          {:else}<p class="muted">Sin picks para este partido.</p>{/each}
        </div>
        <div class="match-section-head"><span class="muted">{(tops[match.id] ?? []).length} destacados</span><a class="link-more" href={`/estadisticas/${match.id}`}>Ver todos →</a></div>
      </section>
    {/each}</div>
    {#if remaining > 0}
      <div style="display:flex;justify-content:center;margin:20px 0 8px">
        <button class="cta" onclick={() => (limit += PAGE)}>Cargar más ({remaining} restantes)</button>
      </div>
    {/if}
  {/if}
  </div>
</main>
