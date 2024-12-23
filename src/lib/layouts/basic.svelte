<script>
	import Breakpoint from "$lib/components/breakpoint.svelte";
	import { fade } from "svelte/transition";

	let {
		elem_scroll = $bindable(),
		children,
		View,
		Topbar,
		Toolbar,
		Sidebar,
		hue = "base",
		class: klass = "",
		"class-toolbar": class_toolbar = "",
	} = $props();

	let side = $state(false);
	let props = $derived({ side });
</script>

<div class="box-row overflow-hidden">
	<div in:fade class="box-fill">
		{#if Topbar}
			<div class="bg-hue-3 shadow-base-y flex justify-center p-1 z-1">
				<div class="flex-1 flex gap-2 md:max-w-screen-sm">
					{@render Topbar?.(props)}
				</div>
			</div>
		{/if}

		<div bind:this={elem_scroll} class="box-scroll md:(p-8 gap-8) {klass}">
			{@render children?.()}
			{@render View?.(props)}

			{#if Toolbar}
				<div
					class="
					sticky bottom-0 bg-hue-4 transition-300 flex p-2 gap-2
					lt-md:shadow-base-y
					md:(card self-center shadow-md)
					{side ? '2xl:self-start' : ''}
					hue-{hue} {class_toolbar}"
				>
					{@render Toolbar?.(props)}
				</div>
			{/if}
		</div>
	</div>

	{#if Sidebar}
		<Breakpoint min="2xl" bind:matched={side}>
			<div class="box w-screen-sm bg-hue-2 shadow-base-x">
				<div class="box-fill">
					{@render Sidebar?.(props)}
				</div>
			</div>
		</Breakpoint>
	{/if}
</div>
