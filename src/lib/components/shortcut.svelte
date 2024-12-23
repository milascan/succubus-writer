<script>
	const {
		children,
		handle,
		key = null,
		code = null,
		ctrl = false,
		shift = false,
		alt = false,
		meta = false,
		global = false,
	} = $props();

	function key_handle(e) {
		if ((key && key === e.key) || (code && code === e.code))
			if (
				ctrl === e.ctrlKey &&
				shift === e.shiftKey &&
				alt === e.altKey &&
				meta === e.metaKey
			) {
				e.preventDefault();
				e.stopPropagation();
				handle?.(e);
			}
	}
</script>

<svelte:document onkeydowncapture={global ? key_handle : undefined} />
{#if global}
	{@render children?.()}
{:else}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="contents" onkeydown={key_handle}>
		{@render children?.()}
	</div>
{/if}
