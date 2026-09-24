/** Shape de partido para la UI (antes tenia tambien mocks hardcodeados: eliminados). */
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
