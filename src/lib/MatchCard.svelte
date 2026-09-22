<script lang="ts">
  import type { Match } from './matches'
  let { match, href }: { match: Match; href?: string | null } = $props()
  const leagueLabel = $derived(match.league === 'ESP-La Liga' ? 'La Liga' : match.league === 'ENG-Premier League' ? 'Premier League' : match.league)
</script>

{#if href === null}
<div class="match-card" aria-label={`${match.home} contra ${match.away}`}>
  <div class="match-top"><span>{leagueLabel}</span><span class="date">{match.date}</span></div>
  <div class="teams">
    <div class="team"><span class="crest" style={`--team-color: ${match.homeColor}`}>{match.homeShort}</span><strong>{match.home}</strong></div>
    <div class="versus"><span class="time">{match.time}</span><span class="vs">VS</span></div>
    <div class="team team-away"><span class="crest" style={`--team-color: ${match.awayColor}`}>{match.awayShort}</span><strong>{match.away}</strong></div>
  </div>
  <div class="match-bottom"><span>{match.venue ? `Estadio ${match.venue}` : match.date || 'Fixture'}</span></div>
</div>
{:else}
<a class="match-card" href={href ?? `/estadisticas/${match.id}`} aria-label={`Ver estadísticas de ${match.home} contra ${match.away}`}>
  <div class="match-top"><span>{leagueLabel}</span><span class="date">{match.date}</span></div>
  <div class="teams">
    <div class="team"><span class="crest" style={`--team-color: ${match.homeColor}`}>{match.homeShort}</span><strong>{match.home}</strong></div>
    <div class="versus"><span class="time">{match.time}</span><span class="vs">VS</span></div>
    <div class="team team-away"><span class="crest" style={`--team-color: ${match.awayColor}`}>{match.awayShort}</span><strong>{match.away}</strong></div>
  </div>
  <div class="match-bottom"><span>{match.venue ? `Estadio ${match.venue}` : match.date || 'Fixture'}</span><span class="arrow" aria-hidden="true">↗</span></div>
</a>
{/if}
<!-- Estilos en src/app.css (.match-card, .teams, ...) para no duplicar -->
