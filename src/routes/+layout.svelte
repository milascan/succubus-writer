<script>
	import "../app.css";
	import { onMount } from "svelte";
	import { slots } from "$lib/global/body-slots.ts";
	let { children } = $props();

	onMount(() => {
		const theme_is_dark = matchMedia("(prefers-color-scheme: dark)");
		const update = () => {
			if (theme_is_dark.matches) {
				document.body.classList.add("dark-theme");
			} else {
				document.body.classList.remove("dark-theme");
			}
		};
		theme_is_dark.addEventListener("change", update);
		update();
		document.body.removeAttribute("un-cloak");
		return () => theme_is_dark.removeEventListener("change", update);
	});
</script>

{@render children?.()}

{#each slots as slot}
	{@render slot()}
{/each}
