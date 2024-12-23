<script>
	import { fade, fly, slide } from "svelte/transition";
	import Backable from "./backable.svelte";
	import BodySlot from "./body-slot.svelte";

	let {
		position = { x: 0, y: 0 },
		anchor = { x: 0.5, y: 0.5 },
		children,
		Button,
		View,
		class: klass = "",
		"class-mask": class_mask = "",
		...rest
	} = $props();

	let visible = $state(false);
	let size = $state([]);
	let x = $derived(size[0] && position.x - size[0].inlineSize * anchor.x);
	let y = $derived(size[0] && position.y - size[0].blockSize * anchor.y);

	function show() {
		visible = true;
	}

	function hide() {
		visible = false;
	}

	function toggle() {
		visible = !visible;
	}
</script>

{@render children?.()}
{@render Button?.({ visible, show, hide, toggle })}

{#if visible}
	<BodySlot>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			transition:fade|global={{ duration: 100 }}
			class="fixed inset-0 z-9 {class_mask}"
			onclick={function ({ target }) {
				if (target === this) visible = false;
			}}
		>
			<div
				transition:slide|global={{ duration: 300 }}
				bind:borderBoxSize={size}
				class="absolute {klass}"
				style={`left: ${x}px; top: ${y}px;`}
				{...rest}
			>
				{@render View?.({ visible, show, hide, toggle })}
			</div>
		</div>
	</BodySlot>
{/if}

{#if visible}
	<Backable onback={() => (visible = false)} />
{/if}
