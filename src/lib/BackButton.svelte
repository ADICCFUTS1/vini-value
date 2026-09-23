<script lang="ts">
	import { goto } from '$app/navigation';

	let { fallback = '/fixture', label = 'Volver' }: { fallback?: string; label?: string } = $props();

	function goBack() {
		// Vuelve a la página anterior del historial (conserva ?fecha= personalizada).
		// Solo si se abrió directo (sin historial) usa el fallback.
		if (typeof window !== 'undefined' && window.history.length > 1) window.history.back();
		else goto(fallback);
	}
</script>

<button class="back-btn" onclick={goBack} aria-label={label}>← {label}</button>
