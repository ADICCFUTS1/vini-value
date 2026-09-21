<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  onMount(() => goto('/fixture', { replaceState: true }));
</script>
<p style="padding:40px;color:#778196">Redirigiendo a /fixture…</p>
