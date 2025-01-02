<script>
	import { fade, fly } from "svelte/transition";
	import Backable from "./backable.svelte";
	import BodySlot from "./body-slot.svelte";

	let {
		visible = $bindable(false),
		title,
		children,
		Button,
		View,
		class: klass = "",
		fill = false,
		...rest
	} = $props();

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
			transition:fade|global
			class="fixed inset-0 bg-black/20 dark:bg-black/50 flex justify-center md:(p-8 items-center) z-9"
			onclick={function ({ target }) {
				if (target === this) visible = false;
			}}
		>
			<div
				transition:fly|global={{ y: 32 }}
				class="box-fill bg-hue-2 md:(card max-w-screen-sm max-h-[80%] overflow-hidden shadow-lg) {fill
					? 'md:h-full'
					: ''}"
			>
				{#if title}
					<div
						class="relative shadow-base-y flex justify-end items-center p-1 text-(base hue-12) font-bold"
						style="-webkit-app-region:drag"
					>
						<div class="absolute-center flex-1 px-2 text-center">
							{title}
						</div>
						<button
							aria-label="close popup"
							class="button button-base flex"
							style="-webkit-app-region:no-drag"
							onclick={() => (visible = false)}
						>
							<div class="i-mdi:close"></div>
						</button>
					</div>
				{/if}
				<div class="box-fill overflow-auto {klass}" {...rest}>
					{@render View?.({ visible, show, hide, toggle })}
				</div>
			</div>
		</div>
	</BodySlot>
{/if}

{#if visible}
	<Backable onback={() => (visible = false)} />
{/if}
