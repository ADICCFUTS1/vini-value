<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { getMatch } from '$lib/matches';
  import { fetchPicksByGame, fetchFixture } from '$lib/api';

  const id = $derived(page.params.id ?? '');
  const local = $derived(getMatch(id));
  let picks = $state<any[]>([]);
  let fixture = $state<any>(null);
  let loading = $state(true);
  let error = $state('');
  let mercado = $state('Todos');
  let q = $state('');

  const short = (n: string) => (n ?? '').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '???';
  let title = $derived(local ? `${local.home} vs ${local.away}` : fixtureTitle());
  function fixtureTitle() {
    if (Array.isArray(fixture) && fixture[0]) {
      const allTeams = [...new Set(fixture.flatMap((p: any) => [p.team, p.team_rival]))];
      return allTeams.slice(0, 2).join(' vs ');
    }
    if (fixture?.home_team) return `${fixture.home_team} vs ${fixture.away_team}`;
    if (picks[0]) return `${picks[0].team} vs ${picks[0].team_rival}`;
    return id;
  }
  let mercados = $derived(['Todos', ...new Set(picks.map((p) => p.mercado))]);
  const etiquetaMercado = (m: string) => picks.find((p) => p.mercado === m)?.mercado_label ?? m;
  let homeTeam = $derived(picks.find((p) => p.is_home === 1)?.team ?? fixture?.home_team ?? picks[0]?.team ?? '');
  let awayTeam = $derived(picks.find((p) => p.is_home === 0)?.team ?? fixture?.away_team ?? picks[0]?.team_rival ?? '');
  let tab = $state<'home' | 'away'>('home');
  let tabTeam = $derived(tab === 'home' ? homeTeam : awayTeam);
  let filtered = $derived(
    picks.filter(
      (p) =>
        (!tabTeam || p.team === tabTeam) &&
        (mercado === 'Todos' || p.mercado === mercado) &&
        (!q || p.player.toLowerCase().includes(q.toLowerCase()))
    ).sort((a, b) => (b.prob_calibrada ?? b.prob_calculada ?? 0) - (a.prob_calibrada ?? a.prob_calculada ?? 0))
  );

  onMount(async () => {
    try {
      const [fx, pk] = await Promise.all([fetchFixture(id).catch(() => null), fetchPicksByGame(id)]);
      fixture = fx;
      picks = Array.isArray(pk) ? pk : [];
      if (!picks.length && Array.isArray(fx)) picks = fx;
    } catch (e) {
      error = 'No se pudo cargar la API (http://localhost:5000).';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head><title>{title} | Cancha</title></svelte:head>

<main class="page-shell"><div class="container">
  <header class="header">
    <!-- <a class="back" href="/" aria-label="Volver al fixture">←</a> -->
    <span class="display header-title">ESTADÍSTICAS</span><span class="header-spacer"></span></header>

  {#if local}
    <section class="scoreboard"><p>{local.league} · {local.date}</p><div class="score-teams"><div><span class="crest" style={`--team-color:${local.homeColor}`}>{local.homeShort}</span><strong>{local.home}</strong></div><div class="score"><span class="display">—</span><small>PRÓXIMO</small></div><div class="align-right"><span class="crest" style={`--team-color:${local.awayColor}`}>{local.awayShort}</span><strong>{local.away}</strong></div></div><div class="venue">{local.venue} · {local.time}</div></section>
  {:else if picks[0] || fixture}
    <section class="scoreboard"><p>La Liga · {picks[0]?.game_date ?? fixture?.date ?? id}</p><div class="score-teams"><div><span class="crest">{short(picks[0]?.team ?? fixture?.home_team ?? '')}</span><strong>{picks[0]?.team ?? fixture?.home_team ?? 'Local'}</strong></div><div class="score"><span class="display">—</span><small>{id.startsWith('fwd_') ? 'PRÓXIMO' : 'VS'}</small></div><div class="align-right"><span class="crest">{short(picks[0]?.team_rival ?? fixture?.away_team ?? '')}</span><strong>{picks[0]?.team_rival ?? fixture?.away_team ?? 'Visita'}</strong></div></div><div class="venue">{id}</div></section>
  {/if}

  {#if loading}<p class="muted">Cargando /picks?game_id={id}…</p>
  {:else if error && !picks.length}<div class="container empty"><h1 class="display">Partido no encontrado</h1><p class="muted">{error}</p>
    <a href="/">Volver al fixture</a></div>
  {:else}
    <section class="stat-section">
      <div class="section-heading"><h1 class="display">Props · {filtered.length}</h1><span>{id}</span></div>
      <div class="tabs" role="tablist" aria-label="Filtrar por equipo">
        <button role="tab" aria-selected={tab === 'home'} class:active={tab === 'home'} onclick={() => (tab = 'home')}>🏠 {homeTeam || 'Local'}</button>
        <button role="tab" aria-selected={tab === 'away'} class:active={tab === 'away'} onclick={() => (tab = 'away')}>✈️ {awayTeam || 'Visita'}</button>
      </div>
      <div class="toolbar">
        <select bind:value={mercado} aria-label="Filtrar mercado">{#each mercados as m}<option value={m}>{m === 'Todos' ? 'Todos' : etiquetaMercado(m)}</option>{/each}</select>
        <input placeholder="Buscar jugador…" bind:value={q} />
      </div>
      <div class="stat-card">
        {#each filtered.slice(0, 100) as p}
          <div class="stat-row"><span>{p.player} <small>{p.localia ?? p.team} · {p.seleccion ?? `${p.mercado} ${p.linea}`}</small><br /><small class="dim">{p.promedio_esperado != null ? `Promedio ${p.promedio_esperado}` : `λ ${p.lambda_ajustado}`} · {p.contexto_rival ?? ''}{p.cuota_justa ? ` · Justa ${p.cuota_justa}` : ''}</small></span><b>{p.probabilidad_pct != null ? `${p.probabilidad_pct}%` : `${Math.round((p.prob_calibrada ?? p.prob_calculada) * 100)}%`}</b></div>
        {:else}<p class="muted">Sin picks para este partido.</p>{/each}
      </div>
    </section>
  {/if}
  <!-- <a class="action" href="/">Ver todos los partidos <span>→</span></a> -->
</div></main>

<style>
  .page-shell { min-height: 100vh; }
  .header { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; }
  .back { text-decoration: none; font-size: 20px; }
  .header-title { font-size: 13px; letter-spacing: 0.12em; }
  .header-spacer { width: 24px; }
  .scoreboard { border: 1px solid #252b38; border-radius: 18px; padding: 18px; background: #11141c; }
  .score-teams { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; }
  .align-right { text-align: right; }
  .crest { display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; background: #18202f; margin-bottom: 6px; }
  .venue, .muted { color: #778196; font-size: 12px; }
  .stat-section { margin-top: 18px; }
  .section-heading { display: flex; justify-content: space-between; align-items: baseline; }
  .toolbar { display: flex; gap: 8px; margin: 12px 0; }
  .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
  .tabs button { border: 1px solid #293140; color: #8a95a8; background: transparent; border-radius: 12px; padding: 10px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tabs button.active { color: #0b0d12; background: #b8f36b; border-color: #b8f36b; }
  .toolbar select, .toolbar input { background: #151922; color: #dce3ef; border: 1px solid #252b38; border-radius: 10px; padding: 8px 10px; }
  .stat-card { display: flex; flex-direction: column; gap: 8px; }
  .stat-row { display: flex; justify-content: space-between; gap: 8px; border: 1px solid #252b38; border-radius: 12px; padding: 10px 12px; font-size: 13px; }
  .stat-row small { color: #778196; }
  .stat-row small.dim { color: #5b6478; font-size: 11px; }
  .action { display: block; margin: 18px 0 28px; }
  .empty { text-align: center; padding: 60px 0; }
</style>
