<script>
    import TextField from "$lib/components/text-field.svelte";
    import { get_model, predict, decode_char } from "$lib/dnn/model.js";
    import Basic from "$lib/layouts/basic.svelte";
    import { onMount } from "svelte";

    let model = $state();

    let input = $state();
    let value = $state("");
    let enable = $state(true);
    let prompt = $state("");
    let predictions = $state();

    let ime_elem = $state();
    let ime_rect = $state({ width: 0, height: 0 });
    let ime_tar = $state({ x: 8, y: 48, height: 0, disable: true });
    let ime_pos = $state({ x: 0, y: 0 });

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

    function get_sel_pos() {
        const range = document.getSelection().getRangeAt(0);
        const children = [...input.childNodes];
        const head = children
            .slice(0, children.indexOf(range.startContainer))
            .map((n) => n.textContent)
            .join("");
        return [head.length + range.startOffset, head.length + range.endOffset];
    }

    function set_sel_pos(offset) {
        input.textContent = input.textContent;
        const sel = document.getSelection();
        sel.setPosition(input.firstChild ?? input, offset);
    }

    function fill(text) {
        const [start] = get_sel_pos();
        value = value.slice(0, start) + text + value.slice(start);
        setTimeout(() => {
            const n_index = start + text.length;
            set_sel_pos(n_index);
            input.focus();
            request_update();
        }, 0);
    }

    let timer = null;
    function update_autofill() {
        if (input) {
            const [start] = get_sel_pos();
            const p = value.slice(0, start).slice(-16);
            if (prompt !== p) prompt = p;
        }
    }

    function request_update() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            update_autofill();
            const cursor_rect = [
                ...document.getSelection().getRangeAt(0).getClientRects(),
            ].at(-1);
            ime_tar = cursor_rect ?? { x: 8, y: 48, height: 0, disable: true };
        }, 100);
    }

    function oninput(e) {
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
    }

    function onclick() {
        enable = true;
        request_update();
    }

    $effect(async () => {
        if (enable) {
            if (!model) model = await get_model("weighted-0_5");
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

<Basic class="p-0!">
    <div class="box-fill min-w-0">
        <TextField
            bind:field={input}
            class="box-fill p-4 shadow-base-y text-wrap"
            bind:value
            {oninput}
            {onkeydown}
            {onclick}
            oncompositionstart={() => (enable = false)}
            oncompositionend={() => (enable = true)}
        />
        <div
            bind:this={ime_elem}
            bind:contentRect={ime_rect}
            class="hue-pink fixed box card bg-hue-4 divide-(y solid hue-5) text-(sm hue-11)"
            style="left: {ime_pos.x}px; top: {ime_pos.y}px; opacity: {ime_tar.disable
                ? '0'
                : '1'}"
        >
            {#if enable && predictions}
                {@const { linear, branch } = predictions}
                <div class="flex px-2 py-1">
                    <div>{linear[0]}</div>
                    <div class="op-50">{linear.slice(1)}</div>
                </div>
                <div class="grid rows-4 grid-flow-col p-1 gap-0.5 font-mono">
                    {#each branch as pred, index}
                        {@const key = index + 1}
                        {@const has_key = key < 10}
                        <button
                            class="button flex gap-1 px-1 py-0.5 text-start"
                            onclick={() => fill(pred)}
                        >
                            <div class="op-50">
                                {has_key ? key : "-"}
                            </div>
                            <div class="op-80">
                                {pred}
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</Basic>
