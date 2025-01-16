<script>
    import TextField from "$lib/components/text-field.svelte";
    import { get_model, predict, decode_char, slice } from "$lib/dnn/model.js";
    import Basic from "$lib/layouts/basic.svelte";
    import { onMount } from "svelte";

    let model = $state();

    let input = $state();
    let value = $state("");
    let enable = $state(true);
    let hide = $state(true);
    let prompt = $state("");
    let predictions = $state();

    let ime_elem = $state();
    let ime_rect = $state({ width: 0, height: 0 });
    let ime_tar = $state({ x: 8, y: 48, height: 0, disable: true });
    let ime_pos = $state({ x: 0, y: 0 });

    let scroll_elem = $state();

    $effect(() => {
        ime_pos.x = Math.min(ime_tar.x, window.innerWidth - ime_rect.width);
        ime_pos.y =
            ime_tar.y + ime_tar.height + ime_rect.height > window.innerHeight
                ? ime_tar.y - ime_rect.height
                : ime_tar.y + ime_tar.height;
    });

    onMount(() => {
        const key = "writer::value";
        value = localStorage.getItem(key) ?? "";
        const timer = setInterval(() => {
            localStorage.setItem(key, value);
        }, 60000);
        setTimeout(() => {
            scroll_elem.scrollTo({
                left: 0,
                top: scroll_elem.scrollHeight,
                behavior: "instant",
            });
        }, 0);
        return () => {
            clearInterval(timer);
        };
    });

    async function guess(model, prompt, length) {
        const res = [];
        for (let i = 0; i < length; i++) {
            const c = decode_char((await predict(model, prompt))[0][1]);
            res.push(c);
            prompt += c;
        }
        return res.join("");
    }

    function fill(text) {
        const [start] = input.get_cursor();
        input.insert(start, text);
        setTimeout(() => {
            const n_index = start + text.length;
            input.set_cursor(n_index);
            input.focus();
            request_update();
        }, 0);
    }

    let timer = null;
    function update_autofill() {
        if (input) {
            const [start] = input.get_cursor();
            const p = slice(value, start);
            if (prompt !== p) prompt = p;
        }
    }

    function request_update() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            update_autofill();
            const cursor_rect = input.get_cursor_rect();
            ime_tar = cursor_rect ?? { x: 8, y: 48, height: 0, disable: true };
        }, 100);
    }

    function oninput(e) {
        hide = false;
        request_update();
    }

    function onkeydown(e) {
        if (enable) {
            if (e.key === "Tab") {
                e.preventDefault();
                fill(predictions.branch[0]);
            } else {
                const num = Number.parseInt(e.key);
                if (!Number.isNaN(num)) {
                    e.preventDefault();
                    fill(predictions.branch[num - 1]);
                }
            }
        }
        request_update();
        if (input.is_end()) {
            scroll_elem.scrollTop = scroll_elem.scrollHeight;
        }
    }

    function onclick() {
        hide = true;
    }

    $effect(async () => {
        if (enable) {
            if (!model) model = await get_model("unweighted");
            async function calc(model) {
                const p = prompt;
                const chars = (await predict(model, p))
                    .slice(0, 8)
                    .map((r) => decode_char(r[1]));
                const predictions = {
                    linear: chars[0] + (await guess(model, p + chars[0], 4)),
                    branch: chars,
                };
                return predictions;
            }
            predictions = await calc(model);
        }
    });
</script>

<svelte:head>
    <title>Succubus Writer</title>
</svelte:head>

<Basic class="p-0!">
    <div class="box-fill">
        <div bind:this={scroll_elem} class="box-scroll md:p-4">
            <TextField
                bind:this={input}
                class="box-fill md:(w-screen-sm self-center card)"
                class-field="lt-md:p-4 md:(p-8 pb-40vh) text-wrap font-mono"
                placeholder="请输入文本..."
                autofocus
                tabindex="0"
                bind:value
                {oninput}
                {onkeydown}
                {onclick}
                oncompositionstart={() => (enable = false)}
                oncompositionend={() => (enable = true)}
            />
        </div>
        <div
            bind:this={ime_elem}
            bind:contentRect={ime_rect}
            class="
                light:hue-green dark:hue-crimson
                box bg-hue-4 divide-(y solid hue-5A) text-(base hue-11)
                lt-md:shadow-base-y md:(fixed card)"
            style="left: {ime_pos.x}px; top: {ime_pos.y}px; opacity: {ime_tar.disable
                ? '0'
                : '1'}"
        >
            {#if !hide && enable && predictions}
                {@const { linear, branch } = predictions}
                <div class="flex px-2 py-1 lt-md:text-sm">
                    <div>{linear[0]}</div>
                    <div class="op-50">{linear.slice(1)}</div>
                </div>
                <div
                    class="lt-md:(flex flex-wrap) md:(grid rows-4 grid-flow-col p-1 gap-0.5 font-mono)"
                >
                    {#each branch as pred, index}
                        {@const key = index + 1}
                        {@const has_key = key < 10}
                        <button
                            class="button fill flex gap-1 lt-md:(flex-1 rect! p-2 text-(xl center)) md:(px-1 py-0.5 text-start)"
                            onclick={(e) => (fill(pred), e.preventDefault())}
                            onmousedown={(e) => e.preventDefault()}
                            onmouseup={(e) => e.preventDefault()}
                            onpointerdown={(e) => e.preventDefault()}
                            onpointerup={(e) => e.preventDefault()}
                        >
                            <div class="op-50 lt-md:hidden">
                                {has_key ? key : "-"}
                            </div>
                            <div class="flex-1 op-80">
                                {pred}
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</Basic>
