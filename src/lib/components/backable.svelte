<script>
	import { pushState } from "$app/navigation";
	import { page } from "$app/stores";
	import { ulid } from "@std/ulid";
	import { onMount } from "svelte";

	let { onback } = $props();

	const pre_state = (() => $page.state)();

	onMount(() => {
		const u_state = ulid();
		let poped = false;
		pushState("", { ...pre_state, [u_state]: true });
		const handle = (e) => {
			if (!(u_state in e.state["sveltekit:states"])) {
				e.stopImmediatePropagation();
				e.stopPropagation();
				poped = true;
				onback?.();
			}
		};
		window.addEventListener("popstate", handle);
		return () => {
			if (!poped) history.back();
			window.removeEventListener("popstate", handle);
		};
	});
</script>
