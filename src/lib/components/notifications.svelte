<script>
	import { fade, fly } from 'svelte/transition';

	export function popup(opts) {
		return create({
			style: 'popup',
			color: 'base',
			title: '',
			detail: '',
			timeout: 2000,
			...opts
		});
	}

	export function notice(opts) {
		return create({
			style: 'notice',
			color: 'base',
			title: '',
			detail: '',
			timeout: 5000,
			...opts
		});
	}

	export function create(data) {
		if (data.style === 'popup') {
			popups.push(data);
			setTimeout(() => {
				popups.splice(popups.indexOf(data), 1);
				popups = popups;
			}, data.timeout);
			popups = popups;
		} else if (data.style === 'notice') {
			notices.push(data);
			setTimeout(() => {
				notices.splice(notices.indexOf(data), 1);
				notices = notices;
			}, data.timeout);
			notices = notices;
		} else {
			throw 'unknow notification style';
		}
	}

	let popups = $state([]);
	let notices = $state([]);

	const style = 'card fill py-2 px-4';
</script>

{#each popups as { color, title, detail }}
	<div
		transition:fade
		class="fixed inset-0 bg-white/50 dark:bg-black/50 flex justify-center items-center z-[9999]"
	>
		<div transition:fly={{ y: 100 }} class="hue-{color} {style}">
			{#if title}
				<div class="text-lg font-bold">{title}</div>
			{/if}
			{#if detail}
				<div class="text-base">{detail}</div>
			{/if}
		</div>
	</div>
{/each}

<div class="fixed right-4 bottom-4 pointer-events-none flex flex-col items-end gap-2 z-[9999]">
	{#each notices as { color, title, detail }}
		<div class="hue-{color} {style}">
			<div class="font-bold">{title}</div>
			{#if detail}
				<div class="text-base">{detail}</div>
			{/if}
		</div>
	{/each}
</div>
