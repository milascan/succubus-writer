<script>
	import "../app.css";
	import Notifications from "$lib/components/notifications.svelte";
	import { onMount, setContext } from "svelte";
	import { slots } from "$lib/global/body-slots.ts";
	import { beforeNavigate } from "$app/navigation";
	let { children, data } = $props();

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

	let notifications = $state();

	const popup = (opts) => notifications?.popup(opts);
	const notice = (opts) => notifications?.notice(opts);

	const { api: _api } = data;

	const api = async (url, data = null, opts = {}) => {
		try {
			return await _api(url, data, opts);
		} catch (e) {
			popup({ title: "错误", detail: e, color: "err" });
			throw e;
		}
	};

	setContext("popup", popup);
	setContext("notice", notice);
	setContext("api", api);

	let history_stack = [];

	const array_start = (ary, head) => {
		const len = Math.min(ary.length, head.length);
		for (let i = 0; i < len; i++) {
			if (ary[i] !== head[i]) return false;
		}
		return true;
	};

	const array_is_parent = (parent, ary) => {
		if (parent.length >= ary.length) {
			return false;
		}
		return array_start(ary, parent);
	};

	beforeNavigate((e) => {
		if (e.to) {
			if (["link", "form", "goto"].includes(e.type)) {
				history_stack.push(e.from.route.id.slice(1).split("/"));
			} else if (
				["popstate"].includes(e.type) &&
				Math.abs(e.delta) <= history_stack.length
			) {
				const cur = e.from.route.id.slice(1).split("/");
				const tar = e.to.route.id.slice(1).split("/");
				if (array_is_parent(tar, cur)) {
					for (let i = 0; i < -e.delta; i++) {
						history_stack.pop();
					}
				} else {
					const tar_i = history_stack.findLastIndex((h) =>
						array_is_parent(h, cur),
					);
					if (tar_i >= 0) {
						e.cancel();
						history.go(tar_i - history_stack.length);
					} else {
						const delta = -history_stack.length;
						history_stack = [];
						history.go(delta);
						popup({ detail: "再返回一次退出", color: "base" });
					}
				}
			}
		}
	});
</script>

{@render children?.()}

<Notifications bind:this={notifications} />

{#each slots as slot}
	{@render slot()}
{/each}
