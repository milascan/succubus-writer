<script>
	import Breakpoint from "$lib/components/breakpoint.svelte";
	let { children, navs, path } = $props();
</script>

<svelte:head>
	<title>{path.at(-1).label}</title>
</svelte:head>

<Breakpoint min="md">
	<div
		class="
			relative bg-hue-3 shadow-base-y z-2
			flex px-1 gap-1"
	>
		<div class="flex-1 flex">
			{#if path.length > 1}
				<a
					href={path.at(-2).href}
					class="button button-base my-1"
					aria-label="back"
				>
					<div class="i-mdi:arrow-back-ios-new"></div>
				</a>
			{/if}
			<div
				class="flex-1 self-stretch flex items-center"
				style="-webkit-app-region:drag"
			>
				<div class="px-3 font-bold">{path.at(-1).label}</div>
			</div>
		</div>
		<div class="flex py-1 items-center gap-1">
			{#each navs as { label, href, icon }}
				{@const toggled = path.some((p) => p.href === href)}
				<a
					{href}
					data-sveltekit-replacestate
					class="button button-detail toggled:hue-prim"
					{toggled}
				>
					<div class={icon}></div>
					<div class="my--1">{label}</div>
				</a>
			{/each}
		</div>
		<div class="flex-1 flex">
			<div
				class="flex-1 self-stretch"
				style="-webkit-app-region:drag"
			></div>
		</div>
	</div>

	{#snippet Else()}
		<div
			class="
				relative min-h-12 bg-hue-3 shadow-base-y z-2
				flex px-1 items-center gap-1"
		>
			<div class="flex-1 flex">
				{#if path.length > 1}
					<a
						href={path.at(-2).href}
						class="button button-base my-1"
						aria-label="back"
					>
						<div class="i-mdi:arrow-back-ios-new"></div>
					</a>
				{/if}
				<div
					class="flex-1 self-stretch"
					style="-webkit-app-region:drag"
				></div>
			</div>
			<div class="flex py-1 items-center gap-1 font-bold">
				<div>{path.at(-1).label}</div>
			</div>
			<div class="flex-1 flex">
				<div
					class="flex-1 self-stretch"
					style="-webkit-app-region:drag"
				></div>
			</div>
		</div>
	{/snippet}
</Breakpoint>

<div class="flex-1 min-h-0 bg-hue-3 flex flex-col">
	{@render children?.()}
</div>

<Breakpoint min="md">
	<div
		class="
			bg-hue-3 shadow-base-y z-2
			flex p-1 items-center text-(sm hue-11) gap-1"
	>
		<div class="ps-2 flex text-xs">
			<div class="i-mdi:arrow-forward-ios"></div>
		</div>
		{#each path as { label, href }}
			<a
				{href}
				class="button @hover:(text-hue-12 bg-hue-5) flex px-2 py-1"
			>
				<div class="my--1">{label}</div>
			</a>
		{/each}
	</div>

	{#snippet Else()}
		<div
			class="
				bg-hue-3 shadow-base-y z-2
				flex p-1 justify-evenly items-center gap-1"
		>
			{#each navs as { label, href, icon }}
				{@const toggled = path.some((p) => p.href === href)}
				<a
					{href}
					class="flex-1 button button-detail gap-1 toggled:hue-prim"
					{toggled}
				>
					<div class="text-xl {icon}"></div>
					<div class="text-sm">{label}</div>
				</a>
			{/each}
		</div>
	{/snippet}
</Breakpoint>
