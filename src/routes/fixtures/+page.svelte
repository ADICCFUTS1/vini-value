<script lang="ts">
  // Redirect client-side conservando query: el sitio es prerender + ssr=false.
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  $effect(() => {
    goto(`/fixture${page.url.search}`, { replaceState: true, noScroll: true });
  });
</script>

<p style="padding:40px;color:#778196">Redirigiendo a <a href="/fixture">/fixture</a>…</p>
