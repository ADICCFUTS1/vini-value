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
  <div class="match-bottom"><span>Estadio {match.venue}</span></div>
</div>
{:else}
<a class="match-card" href={href ?? `/estadisticas/${match.id}`} aria-label={`Ver estadísticas de ${match.home} contra ${match.away}`}>
  <div class="match-top"><span>{leagueLabel}</span><span class="date">{match.date}</span></div>
  <div class="teams">
    <div class="team"><span class="crest" style={`--team-color: ${match.homeColor}`}>{match.homeShort}</span><strong>{match.home}</strong></div>
    <div class="versus"><span class="time">{match.time}</span><span class="vs">VS</span></div>
    <div class="team team-away"><span class="crest" style={`--team-color: ${match.awayColor}`}>{match.awayShort}</span><strong>{match.away}</strong></div>
  </div>
  <div class="match-bottom"><span>Estadio {match.venue}</span><span class="arrow" aria-hidden="true">↗</span></div>
</a>
{/if}

<style>
  .match-card { display: block; padding: 18px; border: 1px solid #252b38; border-radius: 18px; background: linear-gradient(145deg,#171b25,#11141c); box-shadow: 0 12px 30px #0000001c; transition: transform .2s, border-color .2s; }
  .match-card:active { transform: scale(.985); }
  .match-card:hover { border-color: #46516a; }
  .match-top, .match-bottom { display:flex; justify-content:space-between; align-items:center; color:#7f899d; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
  .date { color:#dce3ef; }
  .teams { display:grid; grid-template-columns:1fr 52px 1fr; align-items:center; gap:8px; padding:22px 0 18px; }
  .team { display:flex; flex-direction:column; align-items:flex-start; gap:9px; min-width:0; }
  .team-away { align-items:flex-end; text-align:right; }
  .team strong { font-size:14px; line-height:1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
  .crest { display:grid; place-items:center; width:48px; height:48px; border-radius:14px; color:white; font-family:'Barlow Condensed',sans-serif; font-size:15px; letter-spacing:.04em; background:linear-gradient(145deg,var(--team-color),#18202f); box-shadow: inset 0 0 0 1px #ffffff30; }
  .versus { display:flex; flex-direction:column; align-items:center; gap:6px; }
  .time { color:#f8fafc; font-family:'Barlow Condensed',sans-serif; font-size:20px; font-weight:700; }
  .vs { color:#697489; font-size:10px; font-weight:700; }
  .match-bottom { border-top:1px solid #242a36; padding-top:12px; font-size:10px; letter-spacing:.03em; text-transform:none; font-weight:500; }
  .arrow { display:grid; place-items:center; width:24px; height:24px; color:#0b0d12; background:#b8f36b; border-radius:50%; font-size:15px; }
</style>
