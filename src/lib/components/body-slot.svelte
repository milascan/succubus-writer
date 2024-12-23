<script>
	import { slots } from "$lib/global/body-slots.ts";
	import { onMount } from "svelte";

	let { children } = $props();

	onMount(() => {
		slots.add(children);
		return () => {
			slots.delete(children);
		};
	});
</script>
