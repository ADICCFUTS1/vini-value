<script lang="ts">
  import '../app.css'

  let { children } = $props()
</script>

<svelte:head>
  <title>Cancha | Fixture y estadísticas</title>
  <meta name="description" content="Fixture de fútbol y estadísticas de cada partido." />
  <meta name="theme-color" content="#0b0d12" />
</svelte:head>

{@render children()}
