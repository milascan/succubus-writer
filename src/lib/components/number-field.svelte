<script>
	let { value = $bindable(0), class: klass, ...rest } = $props();
</script>

<input class={klass} type="number" bind:value {...rest} />

<style>
	@layer components {
		input {
			all: unset;
			display: block;
			height: auto;
			border: none;
			background: none;
			font: inherit;
			color: inherit;
		}
	}
</style>
