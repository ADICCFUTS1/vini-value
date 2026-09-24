<script lang="ts">
  import type { Match } from './matches'
  import { ligaName } from './fixtures'
  let { match, href }: { match: Match; href?: string | null } = $props()
  const isLink = $derived(href !== null)
</script>

<svelte:element
  this={isLink ? 'a' : 'div'}
  class="match-card"
  href={isLink ? (href ?? `/estadisticas/${match.id}`) : undefined}
  aria-label={isLink
    ? `Ver estadísticas de ${match.home} contra ${match.away}`
    : `${match.home} contra ${match.away}`}
>
  <div class="match-top"><span>{ligaName(match.league)}</span><span class="date">{match.date}</span></div>
  <div class="teams">
    <div class="team"><span class="crest" style={`--team-color: ${match.homeColor}`}>{match.homeShort}</span><strong>{match.home}</strong></div>
    <div class="versus"><span class="time">{match.status === 'finished' && match.score ? `${match.score[0]}–${match.score[1]}` : match.time}</span><span class="vs">VS</span></div>
    <div class="team team-away"><span class="crest" style={`--team-color: ${match.awayColor}`}>{match.awayShort}</span><strong>{match.away}</strong></div>
  </div>
  <div class="match-bottom">
    <span>{match.venue ? `Estadio ${match.venue}` : match.date || 'Fixture'}</span>
    {#if isLink}<span class="arrow" aria-hidden="true">↗</span>{/if}
  </div>
</svelte:element>
<!-- Estilos en src/app.css (.match-card, .teams, ...) para no duplicar -->
