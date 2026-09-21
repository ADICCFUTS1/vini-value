<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  onMount(() => goto(`/fixture${page.url.search}`, { replaceState: true }));
</script>
<p style="padding:40px;color:#778196">Redirigiendo a /fixture…</p>
