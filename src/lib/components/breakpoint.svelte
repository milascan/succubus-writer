<script>
	import { onMount } from "svelte";

	const Breakpoints = {
		xs: [null, "639.9px"],
		sm: ["640px", "767.9px"],
		md: ["768px", "1023.9px"],
		lg: ["1024px", "1279.9px"],
		xl: ["1280px", "1535.9px"],
		"2xl": ["1536px", null],
	};
	let {
		children,
		Else,
		min = null,
		max = null,
		inverse = false,
		matched = $bindable(false),
	} = $props();

	let visible = $state(false);

	onMount(() => {
		const qmin = min ? `(min-width:${Breakpoints[min][0]})` : null;
		const qmax = max ? `(max-width:${Breakpoints[max][1]})` : null;
		const query = [qmin, qmax].filter((q) => q).join("and");
		const match = matchMedia(query);
		const update = () => {
			matched = inverse ? !match.matches : !!match.matches;
			visible = matched;
		};
		match.addEventListener("change", update);
		update();
		return () => match.removeEventListener("change", update);
	});
</script>

{#if visible}
	{@render children?.()}
{:else}
	{@render Else?.()}
{/if}
