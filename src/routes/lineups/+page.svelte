<script lang="ts">
  import { page } from '$app/state';
  import { fetchLineup } from '$lib/api';

  let gameId = $derived(page.url.searchParams.get('game_id') ?? '');
  let rows = $state<any[]>([]);
  let loading = $state(true);

  // fetchLineup nunca tira, pero el finally garantiza que loading no quede colgado
  $effect(() => {
    const g = gameId;
    loading = true;
    fetchLineup(g)
      .then((r) => (rows = r))
      .finally(() => (loading = false));
  });

  let teams = $derived([...new Set(rows.map((r) => r.team))]);
  const xi = (t: string) => rows.filter((r) => r.team === t && r.is_starter == 1);
  const subs = (t: string) => rows.filter((r) => r.team === t && r.is_starter != 1);
</script>

<main class="page-shell"><div class="container">
  <header class="header"><a class="back" href="/fixture">←</a><span class="display header-title">FORMACIÓN</span><span class="header-spacer"></span></header>
  {#if !gameId}<p class="muted">Falta <code>?game_id=</code>.</p>
  {:else if loading}<p class="muted">Cargando acta {gameId}…</p>
  {:else if !rows.length}<p class="muted">Sin acta para {gameId} (partido futuro o sin datos).</p>
  {:else}
    {#each teams as t}
      <section class="stat-section">
        <div class="section-heading"><h1 class="display">{t}</h1><span>{xi(t).length} TITULARES</span></div>
        <div class="stat-card">
          <p class="muted">XI</p>
          {#each xi(t) as p}<div class="stat-row"><span>{p.player} <small>{p.position ?? ''}</small></span><b>{p.minutes_played}'</b></div>{/each}
          {#if subs(t).length}<p class="muted">SUPLENTES USADOS</p>
          {#each subs(t) as p}<div class="stat-row"><span>{p.player} <small>{p.position ?? ''}</small></span><b>{p.minutes_played}'</b></div>{/each}{/if}
        </div>
      </section>
    {/each}
  {/if}
</div></main>

<style>
  .header { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; }
  .back { text-decoration: none; font-size: 20px; }
  .header-title { font-size: 13px; letter-spacing: 0.12em; }
  .header-spacer { width: 24px; }
  .muted { color: #778196; font-size: 12px; }
  .stat-section { margin-top: 18px; }
  .section-heading { display: flex; justify-content: space-between; align-items: baseline; }
  .stat-card { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
  .stat-row { display: flex; justify-content: space-between; gap: 8px; border: 1px solid #252b38; border-radius: 12px; padding: 10px 12px; font-size: 13px; }
  .stat-row small { color: #778196; }
</style>
