<script lang="ts">
  import { page } from '$app/state';
  import BackButton from '$lib/BackButton.svelte';
  import { fetchPicksByGame, fetchFixture, fetchLineup } from '$lib/api';
  import { shortName } from '$lib/fixtures';
  import { marketLabel, marketColor, initials, probPct } from '$lib/markets';

  const id = $derived(page.params.id ?? '');
  let picks = $state<any[]>([]);
  let fixture = $state<any>(null);
  let lineup = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');
  let mercado = $state('Todos');
  let q = $state('');

  // Título y scoreboard usan la localía real (is_home), no el primer pick por probabilidad
  let homeTeam = $derived(picks.find((p) => p.is_home === 1)?.team ?? fixture?.home_team ?? picks[0]?.team ?? '');
  let awayTeam = $derived(picks.find((p) => p.is_home === 0)?.team ?? fixture?.away_team ?? picks[0]?.team_rival ?? '');
  let title = $derived(homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : id);
  let mercados = $derived(['Todos', ...new Set(picks.map((p) => p.mercado))]);
  const etiquetaMercado = (m: string) => picks.find((p) => p.mercado === m)?.mercado_label ?? marketLabel(m);
  // Fallback solo para apertura directa (sin historial): vuelve a mercados de esa fecha
  let backFallback = $derived(
    picks[0]?.game_date ? `/mercados?fecha=${picks[0].game_date}` : '/fixture'
  );

  // ---- Formaciones (titulares + suplentes por equipo) ----
  function xiFor(team: string, orderIdx: number, startersOnly: boolean) {
    const rows = lineup.filter((p) => (startersOnly ? p.is_starter === 1 : p.is_starter !== 1));
    if (team) {
      const t = rows.filter((p) => p.team === team);
      if (t.length) return t;
    }
    const teams = [...new Set(rows.map((p) => p.team))];
    const key = teams[orderIdx] ?? teams[0];
    return rows.filter((p) => p.team === key);
  }
  let homeXI = $derived(xiFor(homeTeam, 0, true));
  let awayXI = $derived(xiFor(awayTeam, 1, true));
  let homeBench = $derived(xiFor(homeTeam, 0, false));
  let awayBench = $derived(xiFor(awayTeam, 1, false));
  function shape(xi: any[]): string {
    const def = xi.filter((p) => ['RB', 'LB', 'CB', 'DF', 'LWB', 'RWB'].includes(p.position)).length;
    const mid = xi.filter((p) => ['DM', 'CM', 'AM', 'RM', 'LM', 'MF'].includes(p.position)).length;
    const att = xi.filter((p) => ['FW', 'LW', 'RW'].includes(p.position)).length;
    return def || mid || att ? `${def}-${mid}-${att}` : '';
  }
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
  let limit = $state(10);
  const PAGE = 10;
  let shown = $derived(filtered.slice(0, limit));
  let remaining = $derived(filtered.length - shown.length);

  // Al cambiar de equipo, mercado o búsqueda se vuelve a las primeras 10
  $effect(() => {
    void tab;
    void mercado;
    void q;
    limit = PAGE;
  });

  // Carga reactiva al id: navegar de un partido a otro (SPA) recarga todo.
  // seq descarta respuestas viejas si el id cambia mientras vuela un fetch.
  let seq = 0;
  $effect(() => {
    const gid = id;
    if (!gid) return;
    const my = ++seq;
    loading = true;
    error = '';
    picks = [];
    fixture = null;
    lineup = [];
    mercado = 'Todos';
    q = '';
    tab = 'home';
    (async () => {
      const [fx, pk, lu] = await Promise.all([
        fetchFixture(gid),
        fetchPicksByGame(gid).catch(() => []),
        fetchLineup(gid)
      ]);
      if (my !== seq) return; // llegó tarde: ya hay una carga más nueva
      fixture = fx;
      picks = Array.isArray(pk) ? pk : [];
      lineup = Array.isArray(lu) ? lu : [];
      if (!picks.length && !fixture) error = 'No se pudo cargar la API.';
      loading = false;
    })();
  });
</script>

<svelte:head><title>{title} | Cancha</title></svelte:head>

<main class="page-shell">
  <div class="app-header"><div class="app-header-inner">
    <div style="min-width:0"><div class="display app-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{title}</div><p class="app-sub">Props · {filtered.length} · {id}</p></div>
    <BackButton fallback={backFallback} />
  </div></div>
  <div class="container">

  {#if homeTeam || awayTeam}
    <section class="scoreboard"><p>{picks[0]?.game_date ?? fixture?.date ?? id}</p><div class="score-teams"><div><span class="crest">{shortName(homeTeam)}</span><strong>{homeTeam || 'Local'}</strong></div><div class="score"><span class="display">—</span><small>{id.startsWith('fwd_') ? 'PRÓXIMO' : 'VS'}</small></div><div class="align-right"><span class="crest">{shortName(awayTeam)}</span><strong>{awayTeam || 'Visita'}</strong></div></div><div class="venue">{id}</div></section>
  {/if}

  {#if lineup.length}
    <section class="lineup" aria-label="Formaciones">
      <div class="section-heading"><h2 class="display">Formaciones</h2><span>{homeXI.length + awayXI.length} titulares</span></div>
      <div class="lineup-grid">
        {#each [{ name: homeTeam || 'Local', xi: homeXI, bench: homeBench }, { name: awayTeam || 'Visita', xi: awayXI, bench: awayBench }] as col}
          <div class="lineup-col">
            <div class="lineup-head"><strong>{col.name}</strong>{#if shape(col.xi)}<span class="pill" style="--pill:#b8f36b">{shape(col.xi)}</span>{/if}</div>
            <ul>
              {#each col.xi as p}<li><span class="jersey">{p.jersey_number ?? '–'}</span><span class="lname">{p.player}</span><span class="pos">{p.position ?? ''}</span></li>{/each}
            </ul>
            {#if col.bench.length}
              <details>
                <summary>Suplentes ({col.bench.length})</summary>
                <ul>
                  {#each col.bench as p}<li><span class="jersey">{p.jersey_number ?? '–'}</span><span class="lname">{p.player}{p.minutes_played ? ` · ${p.minutes_played}'` : ''}</span><span class="pos">{p.position ?? ''}</span></li>{/each}
                </ul>
              </details>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if loading}<p class="muted">Cargando props…</p>
  {:else if error && !picks.length}<div class="empty"><h1 class="display">Partido no encontrado</h1><p class="muted">{error}</p>
    <a href="/fixture">Volver al fixture</a></div>
  {:else}
    <section style="margin-top:16px">
      <div class="tabs" role="tablist" aria-label="Filtrar por equipo">
        <button role="tab" aria-selected={tab === 'home'} class:active={tab === 'home'} onclick={() => (tab = 'home')}><span aria-hidden="true">🏠</span> {homeTeam || 'Local'}</button>
        <button role="tab" aria-selected={tab === 'away'} class:active={tab === 'away'} onclick={() => (tab = 'away')}><span aria-hidden="true">✈️</span> {awayTeam || 'Visita'}</button>
      </div>
      <div class="toolbar">
        <select class="select-input" bind:value={mercado} aria-label="Filtrar mercado">{#each mercados as m}<option value={m}>{m === 'Todos' ? 'Todos los mercados' : etiquetaMercado(m)}</option>{/each}</select>
        <input class="search-input" placeholder="Buscar jugador…" bind:value={q} inputmode="search" aria-label="Buscar jugador" />
      </div>
      <p class="muted">Mostrando {shown.length} de {filtered.length} props</p>
      <div class="props-grid">
        {#each shown as p, i}
          {@const pct = probPct(p)}
          {@const ml = p.mercado_label ?? marketLabel(p.mercado)}
          {@const mc = marketColor(p.mercado)}
          <article class="prop" aria-label={`${p.player} ${ml} ${p.linea} ${pct}%`}>
            <div class="prop-top">
              <span class="avatar" style={`--pill:${mc}`}>{initials(p.player)}</span>
              <div style="min-width:0;flex:1"><p class="prop-name">#{i + 1} · {p.player}</p><p class="prop-meta">{p.team} · {ml} {p.linea}</p></div>
              <span class="prob">{pct}%<small>PROB</small></span>
            </div>
            <div class="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Probabilidad ${pct}%`}><i style={`width:${pct}%;--pill:${mc}`}></i></div>
            <div class="prop-foot">
              <span class="pill" style={`--pill:${mc}`}>{p.mercado} {p.linea}</span>
              <span class="prop-detail">{p.promedio_esperado != null ? `Prom ${p.promedio_esperado}` : p.lambda_ajustado != null ? `λ ${p.lambda_ajustado}` : ''}{p.cuota_justa ? ` · Justa ${p.cuota_justa}` : ''}</span>
            </div>
            {#if p.contexto_rival}<p class="prop-detail" style="margin:0">{p.contexto_rival}</p>{/if}
          </article>
        {:else}<p class="muted">Sin picks para este partido.</p>{/each}
      </div>
      {#if remaining > 0}
        <div style="display:flex;justify-content:center;margin:20px 0 8px">
          <button class="cta" onclick={() => (limit += PAGE)}>Cargar más ({remaining} restantes)</button>
        </div>
      {/if}
    </section>
  {/if}
  </div>
</main>

<style>
  .lineup { margin-top: 16px; padding: 16px; border: 1px solid #1d2432; border-radius: 22px; background: #0e1219; }
  .lineup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .lineup-col { min-width: 0; border: 1px solid var(--line); border-radius: 16px; background: var(--card); padding: 12px; }
  .lineup-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
  .lineup-head strong { font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lineup-col ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .lineup-col li { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .jersey { width: 28px; height: 28px; flex: none; display: grid; place-items: center; border-radius: 10px; font-size: 0.75rem; font-weight: 800; color: #0b0d12; background: #b8f36b; }
  .lname { flex: 1; min-width: 0; font-size: 0.82rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pos { flex: none; font-size: 0.68rem; font-weight: 800; color: #8b96a9; }
  .lineup-col details { margin-top: 8px; }
  .lineup-col summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; color: var(--accent); font-size: 0.85rem; font-weight: 800; }
  @media (min-width: 1080px) { .lname { font-size: 0.9rem; } }
</style>
