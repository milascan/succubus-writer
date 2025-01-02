<script>
    import TextField from "$lib/components/text-field.svelte";
    import { get_model, predict, decode_char } from "$lib/dnn/model.js";
    import Basic from "$lib/layouts/basic.svelte";

    let model = $state();

    let input = $state();
    let value = $state("");
    let enable = $state(true);
    let prompt = $state("");
    let predictions = $state();

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
        const index = input.selectionStart;
        value =
            value.slice(0, input.selectionStart) +
            text +
            value.slice(input.selectionStart);
        setTimeout(() => {
            const n_index = index + text.length;
            input.selectionStart = n_index;
            input.selectionEnd = n_index;
            update_autofill();
            input.focus();
        }, 0);
    }

    function update_autofill() {
        if (input) {
            enable = true;
            const p = value.slice(0, input.selectionStart).slice(-16);
            setTimeout(() => {
                if (prompt !== p) prompt = p;
            });
        }
    }

    function oninput(e) {
        if (!e.isComposing) {
            enable = true;
            update_autofill();
        } else {
            enable = false;
        }
    }

    function onkeydown(e) {
        if (enable) {
            const num = Number.parseInt(e.key);
            if (!Number.isNaN(num)) {
                e.preventDefault();
                fill(predictions[num - 1].head);
            }
        }
    }

    $effect(async () => {
        if (!model) model = await get_model("weighted-0_5");
        async function calc(model) {
            const p = prompt;
            const chars = (await predict(model, p))
                .slice(0, 8)
                .map((r) => decode_char(r[1]));
            const predictions = [];
            for (const head of chars) {
                const tail = await guess(model, p + head, 6);
                predictions.push({ head, tail });
            }
            return predictions;
        }
        predictions = await calc(model);
    });
</script>

<Basic class="p-0!">
    <div class="box-fill min-w-0">
        <TextField
            bind:field={input}
            class="box-fill p-4 shadow-base-y text-wrap"
            placeholder="开始撰写..."
            bind:value
            {oninput}
            {onkeydown}
            onclick={update_autofill}
        />
        {#if enable && predictions}
            <div
                class="min-w-0 bg-hue-2 p-2 gap-1 font-mono
                lt-md:(text-lg grid rows-4 grid-flow-col) md:box"
            >
                {#each predictions as { head, tail }, index}
                    {@const key = index + 1}
                    {@const has_key = key < 10}
                    <button
                        class="button flex px-2 py-1 text-start truncate min-w-0"
                        onclick={() => fill(head)}
                    >
                        <div class="text-hue-10">
                            {has_key ? key + "." : "-."}<span
                                class="text-hue-12">{head}</span
                            >
                        </div>
                        <div class="text-hue-10">{tail}</div>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</Basic>
