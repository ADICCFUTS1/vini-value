export type Match = {
  id: string
  league: string
  date: string
  time: string
  home: string
  away: string
  homeShort: string
  awayShort: string
  homeColor: string
  awayColor: string
  status: 'live' | 'upcoming' | 'finished'
  score?: [number, number]
  venue: string
}

export const matches: Match[] = [
  { id: 'river-boca', league: 'Liga Profesional', date: 'HOY · 21:30', time: '21:30', home: 'River Plate', away: 'Boca Juniors', homeShort: 'RIV', awayShort: 'BOC', homeColor: '#e72c45', awayColor: '#2b66d9', status: 'upcoming', venue: 'Mâs Monumental' },
  { id: 'racing-independiente', league: 'Liga Profesional', date: 'MAÑANA · 19:00', time: '19:00', home: 'Racing Club', away: 'Independiente', homeShort: 'RAC', awayShort: 'IND', homeColor: '#60a5fa', awayColor: '#ef4444', status: 'upcoming', venue: 'Presidente Perón' },
  { id: 'barcelona-real-madrid', league: 'La Liga', date: 'DOM · 16:00', time: '16:00', home: 'Barcelona', away: 'Real Madrid', homeShort: 'FCB', awayShort: 'RMA', homeColor: '#c026d3', awayColor: '#f5f5f5', status: 'upcoming', venue: 'Spotify Camp Nou' },
  { id: 'san-lorenzo-huracan', league: 'Liga Profesional', date: 'DOM · 18:30', time: '18:30', home: 'San Lorenzo', away: 'Huracán', homeShort: 'SLO', awayShort: 'HUR', homeColor: '#1554a0', awayColor: '#e9e9e9', status: 'upcoming', venue: 'Pedro Bidegain' }
]

export function getMatch(id: string) {
  return matches.find((match) => match.id === id)
}
