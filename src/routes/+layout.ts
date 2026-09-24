// Sitio 100% estático: prerender de shells + datos client-side desde /api/*.json.
// ssr=false hace que el prerender genere shells livianas y que toda la lógica
// (modo live/static, ?api=, fechas) corra solo en el navegador, sin traps de
// hidratación ni datos de build viejos.
export const prerender = true;
export const ssr = false;
