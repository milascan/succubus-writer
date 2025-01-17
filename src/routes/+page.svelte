<script>
    import PopupFrame from "$lib/components/popup-frame.svelte";
    import TextField from "$lib/components/text-field.svelte";
    import ToggleButton from "$lib/components/toggle-button.svelte";
    import { storage } from "$lib/core/storage.ts";
    import { get_model, predict, decode_char, slice } from "$lib/dnn/model.js";
    import Basic from "$lib/layouts/basic.svelte";
    import { onMount } from "svelte";

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

    const storage_key = "writer::value";
    onMount(() => {
        value = localStorage.getItem(storage_key) ?? "";
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

    let save_timer = null;
    function request_save() {
        if (save_timer) clearTimeout(save_timer);
        save_timer = setTimeout(() => {
            save_timer = null;
            localStorage.setItem(storage_key, value);
        }, 3000);
    }

    async function guess(model, prompt, length) {
        const res = [];
        for (let i = 0; i < length; i++) {
            const c = decode_char((await predict(model, prompt))[0][1]);
            res.push(c);
            prompt += c;
        }
        return res.join("");
    }

    async function do_predict(model, prompt) {
        return (await predict(model, prompt))
            .slice(0, 10)
            .map((r) => decode_char(r[1]));
    }

    let vibrate_dur = storage("writer::vibrate_dur", 25);
    const vibrate_dur_options = [0, 15, 25, 50, 100];

    function fill(text) {
        const [start] = input.get_cursor();
        input.insert(start, text);
        if ($vibrate_dur > 0) navigator.vibrate?.($vibrate_dur);
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
            timer = null;
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
            } else if (e.code.startsWith("Digit")) {
                const num = Number.parseInt(e.code.slice(5));
                if (!Number.isNaN(num)) {
                    e.preventDefault();
                    const idx = num - 1 >= 0 ? num - 1 : 9;
                    if (!e.shiftKey) {
                        fill(predictions.branch[idx]);
                    } else if (predictions.secd_branch?.[idx]) {
                        fill(predictions.secd_branch[idx]);
                    }
                }
            }
        }
        request_update();
        setTimeout(() => {
            if (input.is_end()) {
                scroll_elem.scrollTop = scroll_elem.scrollHeight;
            }
        }, 0);
    }

    function onclick() {
        hide = true;
    }

    let model_name = storage("writer::model_name", "unweighted,weighted-0_5");
    let predict_len = storage("writer::predict_len", 4);
    let enable_secd = storage("writer::enable_secd", true);
    let models = {};

    async function prepare_model(name) {
        if (!models[name]) models[name] = await get_model(name);
        return models[name];
    }

    $effect(async () => {
        prompt;
        if (enable) {
            async function calc(prompt) {
                const model = await prepare_model($model_name.split(",")[0]);
                const items = await do_predict(model, prompt);
                const predictions = {
                    linear:
                        items[0] +
                        (await guess(model, prompt + items[0], $predict_len)),
                    branch: items,
                };
                if ($enable_secd) {
                    const secd_model = await prepare_model(
                        $model_name.split(",")[1],
                    );
                    predictions.secd_branch = await do_predict(
                        secd_model,
                        prompt,
                    );
                }
                return predictions;
            }
            predictions = await calc(prompt);
        }
    });

    $effect(() => {
        value, request_save();
    });

    const s_header_btn = "button button-base text-(sm hue-11)";
    const s_toggle_btn =
        "flex-1 button button-detail justify-center py-2 tint toggled:hue-prim";
    const s_h1 = "my-4 py-2 border-b-(2 solid hue-4A) text-2xl font-bold";
    const s_h2 = "my-3 py-2 text-xl font-bold";
    const s_h3 =
        "hue-prim my-2 py-1 px-4 bg-hue-4A border-l-(4 solid hue-10) text-hue-12 font-bold";
    const s_p = "py-2 text-hue-11";
</script>

<svelte:head>
    <title>Succubus Writer</title>
</svelte:head>

<Basic class="p-0! dark:bg-hue-2">
    <div class="box-fill">
        <div
            class="flex shadow-base-y light:bg-hue-4 dark:bg-hue-3 items-center p-1 gap-1 z-1"
        >
            <div class="flex-1 px-3 text-(lg hue-9) font-bold">
                Succubus Writer
            </div>
            <PopupFrame title="帮助">
                {#snippet Button({ toggle: onclick })}
                    <button aria-label="help" class={s_header_btn} {onclick}>
                        <div class="i-mdi:help-outline"></div>
                    </button>
                {/snippet}
                {#snippet View()}
                    <div class="px-8 py-4 text-wrap">
                        <h1 class={s_h1}>欢迎使用 Succubus Writer</h1>
                        <p class={s_p}>
                            这是一个辅助写作的在线应用，主要提供文本自动补全等功能。
                        </p>
                        <p class={s_p}>
                            同时，该应用的补全等功能是完全本地的，不会采集用户的任何数据，你可以放心使用。
                        </p>
                        <h2 class={s_h2}>功能介绍</h2>
                        <h3 class={s_h3}>自动补全</h3>
                        <p class={s_p}>
                            自动补全是一直开启的功能，当你在输入框内输入文字时就会触发。
                        </p>
                        <p class={s_p}>
                            当触发自动补全时，会弹出一个备选项目框，在桌面端，该弹出框紧贴输入位置，
                            而在移动端，则位于页面底部。
                        </p>
                        <p class={s_p}>
                            备选框显示了两种信息，一种是位于顶部的单行文本，称为前向预测，
                            另一种是在下面的多个单字（一般是10个），称为备选项。
                        </p>
                        <p class={s_p}>
                            其中，备选项是指在当前上下文中，光标处可能接着出现的单字中，概率最大的10个，
                            并按照概率，由大到小排列。这些备选项可以点击或使用对应的数字热键来输入到光标位置。
                            除了可以用数字热键输入备选项以外，还可以用 Tab
                            键来直接输入概率最大的备选项。
                            另外，如果开启了副模型选项，在电脑端可以通过右击选项或
                            Shift +
                            数字键，在手机端则是长按，来输入副模型的备选项。
                        </p>
                        <p class={s_p}>
                            而上面显示的前向预测文本，则是多次选择最高概率备选项之后，可能出现的文本，
                            其预测长度可以在设置中调整，要注意的是，过高的长度可能会导致性能问题。
                        </p>
                    </div>
                {/snippet}
            </PopupFrame>
            <PopupFrame title="设置">
                {#snippet Button({ toggle: onclick })}
                    <button aria-label="config" class={s_header_btn} {onclick}>
                        <div class="i-mdi:settings-outline"></div>
                    </button>
                {/snippet}
                {#snippet View()}
                    <div class="box p-4 gap-4">
                        <div class="font-bold">权重选择</div>
                        <div class="flex gap-2">
                            <ToggleButton
                                class={s_toggle_btn}
                                bind:tree={$model_name}
                                value="unweighted,weighted-0_5"
                                required
                            >
                                <div>非加权权重</div>
                                <div class="flex-1 text-sm op-50">
                                    语句更流畅
                                </div>
                            </ToggleButton>
                            <ToggleButton
                                class={s_toggle_btn}
                                bind:tree={$model_name}
                                value="weighted-0_5,unweighted"
                                required
                            >
                                <div>加权权重</div>
                                <div class="flex-1 text-sm op-50">
                                    辞藻更丰富
                                </div>
                            </ToggleButton>
                        </div>
                        <div class="flex justify-between items-baseline">
                            <div class="font-bold">副权重</div>
                            <div class="text-sm op-50">
                                将未选择的模型作为第二选项提供
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <ToggleButton
                                class={s_toggle_btn}
                                bind:tree={$enable_secd}
                                value={false}
                                required
                            >
                                禁用
                            </ToggleButton>
                            <ToggleButton
                                class={s_toggle_btn}
                                bind:tree={$enable_secd}
                                value={true}
                                required
                            >
                                启用
                            </ToggleButton>
                        </div>
                        <div class="font-bold">预测长度</div>
                        <div class="flex gap-2">
                            {#each Array(10) as _, i}
                                <ToggleButton
                                    class={s_toggle_btn}
                                    bind:tree={$predict_len}
                                    value={i}
                                    required
                                >
                                    {i}
                                </ToggleButton>
                            {/each}
                        </div>
                        <!-- <div class="font-bold">输入模式</div>
                        <div class="flex gap-2">
                            <ToggleButton class={s_toggle_btn}>
                                <div>补全模式</div>
                                <div class="flex-1 text-sm op-50">
                                    仅预测，不影响正常输入
                                </div>
                            </ToggleButton>
                            <ToggleButton class={s_toggle_btn}>
                                <div>输入法模式</div>
                                <div class="flex-1 text-sm op-50">完全代替输入法</div>
                            </ToggleButton>
                        </div>
                        <div class="font-bold">输入法码表</div>
                        <div class="flex gap-2">
                            <ToggleButton class={s_toggle_btn}>
                                拼音
                            </ToggleButton>
                            <ToggleButton class={s_toggle_btn}>
                                键道6
                            </ToggleButton>
                        </div> -->
                        <div class="font-bold">按键震动</div>
                        <div class="flex gap-2">
                            {#each vibrate_dur_options as dur}
                                <ToggleButton
                                    class={s_toggle_btn}
                                    bind:tree={$vibrate_dur}
                                    value={dur}
                                    required
                                >
                                    {dur > 0 ? `${dur}ms` : "禁用"}
                                </ToggleButton>
                            {/each}
                        </div>
                    </div>
                {/snippet}
            </PopupFrame>
        </div>
        <div bind:this={scroll_elem} class="box-scroll md:p-4">
            <TextField
                bind:this={input}
                class="box-fill md:(w-screen-sm self-center card dark:bg-hue-3)"
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
                box bg-hue-4 divide-(y solid hue-5A) text-(base hue-12)
                lt-md:shadow-base-y md:(fixed card)"
            style="left: {ime_pos.x}px; top: {ime_pos.y}px; opacity: {ime_tar.disable
                ? '0'
                : '1'}"
        >
            {#if !hide && enable && predictions}
                {@const { linear, branch, secd_branch } = predictions}
                <div class="flex px-2 py-1 lt-md:text-sm">
                    <div>{linear[0]}</div>
                    <div class="op-50">{linear.slice(1)}...</div>
                </div>
                <div
                    class="lt-md:(flex flex-wrap) md:(grid rows-5 grid-flow-col p-1 gap-0.5 font-mono)"
                >
                    {#each branch as pred, index}
                        {@const key = index + 1 < 10 ? index + 1 : 0}
                        <button
                            class="
                                button gap-1
                                lt-md:(flex-1 box items-center rect! fill p-2 text-(xl center))
                                md:(flex items-baseline px-1 py-0.5 text-start)"
                            onclick={(e) => (fill(pred), e.preventDefault())}
                            onmousedown={(e) => e.preventDefault()}
                            onmouseup={(e) => e.preventDefault()}
                            onpointerdown={(e) => e.preventDefault()}
                            onpointerup={(e) => e.preventDefault()}
                            oncontextmenu={(e) => {
                                const pred = secd_branch?.[index];
                                if (pred) fill(pred);
                                e.preventDefault();
                            }}
                        >
                            <div class="op-50 lt-md:hidden">
                                {key}
                            </div>
                            <div class="flex-1">
                                {pred}
                            </div>
                            {#if secd_branch}
                                <div class="lt-md:text-lg md:text-sm op-50">
                                    {secd_branch[index]}
                                </div>
                            {/if}
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</Basic>
