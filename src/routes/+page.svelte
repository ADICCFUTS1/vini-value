<script lang="ts">
  // Redirect client-side: el sitio es prerender + ssr=false, no hay server load.
  import { goto } from '$app/navigation';

  $effect(() => {
    goto('/fixture', { replaceState: true, noScroll: true });
  });
</script>

<p style="padding:40px;color:#778196">Redirigiendo a <a href="/fixture">/fixture</a>…</p>
