<script>
	import { watch, Previous } from 'runed';
	import { Tree } from '$lib/core/tree.ts';
	import { array_delete, valid } from '$lib/utils.ts';
	import { onMount } from 'svelte';

	let {
		tree = $bindable(),
		toggled = $bindable(false),
		path,
		value = true,
		overwrite = false,
		required = false,
		View
	} = $props();

	const is_overwrite = overwrite || (path === undefined && !(tree instanceof Array));

	let real_toggled = $state(false);
	let timer = null;
	$effect(() => {
		real_toggled = is_overwrite
			? tree === value
			: tree instanceof Tree
				? tree.has(path)
				: tree instanceof Array
					? tree.includes(value)
					: valid(tree?.[path]);
		if (timer !== null) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
			toggled = real_toggled;
		}, 0);
	});

	let pre_path = new Previous(() => path);
	let pre_value = new Previous(() => value);

	watch(
		[() => path, () => value],
		() => {
			if (toggled) unset(pre_path.current, pre_value.current), set();
		},
		{ lazy: true }
	);

	onMount(() => {
		if (
			required &&
			(is_overwrite
				? !valid(tree)
				: tree instanceof Tree
					? !tree.has(path)
					: tree instanceof Array
						? !tree.includes(value)
						: !valid(tree?.[path]))
		) {
			set();
		}
	});

	function set() {
		is_overwrite
			? (tree = value)
			: tree instanceof Tree
				? tree.set(path, value)
				: tree instanceof Array
					? tree.push(value)
					: (tree[path] = value);
	}

	function unset(p = path, v = value) {
		if (required) return;
		is_overwrite
			? (tree = undefined)
			: tree instanceof Tree
				? tree.delete(p)
				: tree instanceof Array
					? array_delete(tree, v)
					: delete tree[p];
	}

	export function toggle() {
		if (real_toggled) {
			unset();
		} else {
			set();
		}
	}
</script>

{@render View?.(toggled, toggle, { set, unset })}
