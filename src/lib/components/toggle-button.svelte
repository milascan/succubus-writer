<script>
	import Toggle from './toggle.svelte';

	let {
		children,
		tree = $bindable(),
		toggled = $bindable(false),
		path,
		value,
		overwrite,
		required,
		...rest
	} = $props();
</script>

<Toggle bind:tree bind:toggled {path} {value} {overwrite} {required}>
	{#snippet View(vtoggled, onclick)}
		<button toggled={vtoggled} {onclick} {...rest}>
			{@render children?.()}
		</button>
	{/snippet}
</Toggle>
