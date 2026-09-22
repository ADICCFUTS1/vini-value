<script lang="ts">
	import { page } from '$app/state';
	const path = $derived(page.url.pathname);
	const fecha = $derived(page.url.searchParams.get('fecha') ?? '');
	const isFixture = $derived(path.startsWith('/fixture') || path === '/');
	const isMercados = $derived(path.startsWith('/mercados'));
	const mercadosHref = $derived(fecha ? `/mercados?fecha=${fecha}` : '/mercados');
</script>

<nav class="bottom-nav" aria-label="Navegación principal">
	<a href="/fixture" class:active={isFixture} aria-current={isFixture ? 'page' : undefined}>
		<span class="bn-icon" aria-hidden="true">◉</span>
		<span>Fixture</span>
	</a>
	<a href={mercadosHref} class:active={isMercados} aria-current={isMercados ? 'page' : undefined}>
		<span class="bn-icon" aria-hidden="true">▣</span>
		<span>Mercados</span>
	</a>
</nav>
