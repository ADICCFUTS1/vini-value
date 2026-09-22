<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { getMatch } from '$lib/matches';
  import { fetchPicksByGame, fetchFixture } from '$lib/api';
  import { marketLabel, marketColor, initials, probPct } from '$lib/markets';

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
  const etiquetaMercado = (m: string) => picks.find((p) => p.mercado === m)?.mercado_label ?? marketLabel(m);
  let homeTeam = $derived(picks.find((p) => p.is_home === 1)?.team ?? fixture?.home_team ?? picks[0]?.team ?? '');
  let awayTeam = $derived(picks.find((p) => p.is_home === 0)?.team ?? fixture?.away_team ?? picks[0]?.team_rival ?? '');
  let tab = $state<'home' | 'away'>('home');
  let tabTeam = $derived(tab === 'home' ? homeTeam : awayTeam);
  let filtered = $derived(
    picks.filter(
      (p) =>
        (!tabTeam || p.team === tabTeam) &&
        (mercado === 'Todos' || p.mercado === mercado) &&
        (!q || String(p.player ?? '').toLowerCase().includes(q.toLowerCase()))
    ).sort((a, b) => (b.prob_calibrada ?? b.prob_calculada ?? 0) - (a.prob_calibrada ?? a.prob_calculada ?? 0))
  );

  onMount(async () => {
    try {
      const [fx, pk] = await Promise.all([fetchFixture(id).catch(() => null), fetchPicksByGame(id)]);
      fixture = fx;
      picks = Array.isArray(pk) ? pk : [];
      if (!picks.length && Array.isArray(fx)) picks = fx;
    } catch {
      error = 'No se pudo cargar la API.';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head><title>{title} | Cancha</title></svelte:head>

<main class="page-shell">
  <div class="app-header"><div class="app-header-inner">
    <div style="min-width:0"><div class="display app-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{title}</div><p class="app-sub">Props · {filtered.length} · {id}</p></div>
    <a class="link-more" href="/fixture">← Fixture</a>
  </div></div>
  <div class="container">

  {#if local}
    <section class="scoreboard"><p>{local.league} · {local.date}</p><div class="score-teams"><div><span class="crest" style={`--team-color:${local.homeColor}`}>{local.homeShort}</span><strong>{local.home}</strong></div><div class="score"><span class="display">—</span><small>PRÓXIMO</small></div><div class="align-right"><span class="crest" style={`--team-color:${local.awayColor}`}>{local.awayShort}</span><strong>{local.away}</strong></div></div><div class="venue">{local.venue} · {local.time}</div></section>
  {:else if picks[0] || fixture}
    <section class="scoreboard"><p>{picks[0]?.game_date ?? fixture?.date ?? id}</p><div class="score-teams"><div><span class="crest">{short(picks[0]?.team ?? fixture?.home_team ?? '')}</span><strong>{picks[0]?.team ?? fixture?.home_team ?? 'Local'}</strong></div><div class="score"><span class="display">—</span><small>{id.startsWith('fwd_') ? 'PRÓXIMO' : 'VS'}</small></div><div class="align-right"><span class="crest">{short(picks[0]?.team_rival ?? fixture?.away_team ?? '')}</span><strong>{picks[0]?.team_rival ?? fixture?.away_team ?? 'Visita'}</strong></div></div><div class="venue">{id}</div></section>
  {/if}

  {#if loading}<p class="muted">Cargando props…</p>
  {:else if error && !picks.length}<div class="empty"><h1 class="display">Partido no encontrado</h1><p class="muted">{error}</p>
    <a href="/fixture">Volver al fixture</a></div>
  {:else}
    <section style="margin-top:16px">
      <div class="tabs" role="tablist" aria-label="Filtrar por equipo">
        <button role="tab" aria-selected={tab === 'home'} class:active={tab === 'home'} onclick={() => (tab = 'home')}>🏠 {homeTeam || 'Local'}</button>
        <button role="tab" aria-selected={tab === 'away'} class:active={tab === 'away'} onclick={() => (tab = 'away')}>✈️ {awayTeam || 'Visita'}</button>
      </div>
      <div class="toolbar">
        <select class="select-input" bind:value={mercado} aria-label="Filtrar mercado">{#each mercados as m}<option value={m}>{m === 'Todos' ? 'Todos los mercados' : etiquetaMercado(m)}</option>{/each}</select>
        <input class="search-input" placeholder="Buscar jugador…" bind:value={q} inputmode="search" aria-label="Buscar jugador" />
      </div>
      <div class="props-grid">
        {#each filtered.slice(0, 100) as p, i}
          {@const pct = probPct(p)}
          {@const ml = p.mercado_label ?? marketLabel(p.mercado)}
          {@const mc = marketColor(p.mercado)}
          <article class="prop" aria-label={`${p.player} ${ml} ${p.linea} ${pct}%`}>
            <div class="prop-top">
              <span class="avatar" style={`--pill:${mc}`}>{initials(p.player)}</span>
              <div style="min-width:0;flex:1"><p class="prop-name">#{i + 1} · {p.player}</p><p class="prop-meta">{p.team} · {ml} {p.linea}</p></div>
              <span class="prob">{pct}%<small>PROB</small></span>
            </div>
            <div class="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={`width:${pct}%;--pill:${mc}`}></i></div>
            <div class="prop-foot">
              <span class="pill" style={`--pill:${mc}`}>{p.mercado} {p.linea}</span>
              <span class="prop-detail">{p.promedio_esperado != null ? `Prom ${p.promedio_esperado}` : p.lambda_ajustado != null ? `λ ${p.lambda_ajustado}` : ''}{p.cuota_justa ? ` · Justa ${p.cuota_justa}` : ''}</span>
            </div>
            {#if p.contexto_rival}<p class="prop-detail" style="margin:0">{p.contexto_rival}</p>{/if}
          </article>
        {:else}<p class="muted">Sin picks para este partido.</p>{/each}
      </div>
    </section>
  {/if}
  </div>
</main>
