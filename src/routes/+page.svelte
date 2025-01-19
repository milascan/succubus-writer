<script>
    import PopupFrame from "$lib/components/popup-frame.svelte";
    import TextField from "$lib/components/text-field.svelte";
    import ToggleButton from "$lib/components/toggle-button.svelte";
    import { storage } from "$lib/core/storage.ts";
    import {
        get_model,
        predict,
        decode_char,
        slice,
        predict_ime,
    } from "$lib/dnn/model.js";
    import Basic from "$lib/layouts/basic.svelte";
    import { onMount, tick } from "svelte";

    let input = $state();
    let value = $state("");
    let enable = $state(true);
    let hide = $state(true);
    let code = $state("");
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
        }, 2000);
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

    function get_predicts(preds) {
        return preds.slice(0, 10).map((r) => decode_char(r[1]));
    }

    let vibrate_dur = storage("writer::vibrate_dur", 25);
    const vibrate_dur_options = [0, 15, 25, 50, 100];

    async function fill(text) {
        const [start] = input.get_cursor();
        if (document.execCommand) {
            document.execCommand("insertText", false, text);
        } else {
            input.insert(start, text);
        }
        if ($vibrate_dur > 0) navigator.vibrate?.($vibrate_dur);
        const n_index = start + text.length;
        input.focus();
        await tick();
        input.set_cursor(n_index);
        request_update();
    }

    let timer = null;
    let pre_code = null;
    let pre_prompt = null;
    async function update_autofill() {
        if (input && enable) {
            const [start] = input.get_cursor();
            const prompt = slice(value, start);
            if (pre_code !== prompt || pre_code !== code) {
                pre_code = code;
                pre_prompt = prompt;
                predictions = await calc(prompt, code);
            }
        }
    }

    let lock = null;
    function request_update() {
        if (lock) clearTimeout(lock);
        lock = setTimeout(async () => {
            lock = null;
            await update_autofill();
            await tick();
            if (input.is_end()) {
                scroll_elem.scrollTop = scroll_elem.scrollHeight;
            }
            const cursor_rect = input.get_cursor_rect();
            ime_tar = cursor_rect ?? {
                x: 8,
                y: 48,
                height: 0,
                disable: true,
            };
        }, 0);
    }

    function oninput() {
        hide = false;
        request_update();
    }

    const up_keys = {
        ",": "，",
        ".": "。",
        "[": "「",
        "]": "」",
        "\\": "、",
        ":": "：",
        ";": "；",
        "?": "？",
        "<": "《",
        ">": "》",
        "|": "・",
        "{": "『",
        "}": "』",
        "~": "～",
        "!": "！",
        $: "￥",
        "^": "……",
        "(": "（",
        ")": "）",
        _: "——",
    };
    function onbeforeinput(e) {
        if (enable && !e.isComposing) {
            hide = false;
            if (e.inputType === "insertText") {
                e.preventDefault();
                const str = e.data;
                if (lock === null) {
                    if (/^[a-z]$/.test(str)) {
                        if (code.length >= $predict_len) {
                            fill(predictions.branch[0][0]);
                        }
                        code = (code + str).slice(-$predict_len);
                    } else if (str === " ") {
                        fill(code.length > 0 ? predictions.linear : " ");
                        code = "";
                    } else {
                        fill(
                            (code.length > 0 ? predictions.linear : "") +
                                (up_keys[str] ?? str),
                        );
                        code = "";
                    }
                }
            }
            if (e.inputType === "deleteContentBackward" && code.length > 0) {
                e.preventDefault();
                code = code.slice(0, -1);
            }
        }
        request_update();
    }

    function onkeydown(e) {
        if (enable) {
            if (e.key === "Tab" && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                if (lock === null) fill(predictions.branch[0][0]);
                code = code.slice(1);
            } else if (e.code.startsWith("Digit")) {
                const num = Number.parseInt(e.code.slice(5));
                if (!Number.isNaN(num)) {
                    if (lock === null) {
                        const idx = num - 1 >= 0 ? num - 1 : 9;
                        if (e.ctrlKey) {
                            e.preventDefault();
                            fill(num.toString());
                        } else if (!e.shiftKey) {
                            e.preventDefault();
                            fill(predictions.branch[idx][0]);
                            code = code.slice(1);
                        }
                    }
                }
            }
        }
        setTimeout(request_update, 0);
    }

    function onclick() {
        hide = true;
        code = "";
        setTimeout(request_update, 0);
    }

    let model_name = storage("writer::model_name", "model");
    let predict_len = storage("writer::predict_len", 4);
    let models = {};

    async function prepare_model(name) {
        if (!models[name]) models[name] = await get_model(name);
        return models[name];
    }

    async function calc(prompt, code) {
        const model = await prepare_model($model_name);
        if (code.length > 0) {
            const [item, preds_list] = await predict_ime(model, prompt, code);
            const predictions = {
                linear: item,
                branch: get_predicts(preds_list[0]),
            };
            return predictions;
        } else {
            const items = get_predicts(await predict(model, prompt));
            const predictions = {
                linear:
                    items[0] +
                    (await guess(model, prompt + items[0], $predict_len - 1)),
                branch: items,
            };
            return predictions;
        }
    }

    function reset_config() {
        const len = localStorage.length;
        const keys = [];
        for (let i = 0; i < len; i++) {
            keys.push(localStorage.key(i));
        }
        for (const k of keys) {
            if (k.startsWith("writer::") && k !== "writer::value") {
                console.log(k);
                localStorage.removeItem(k);
            }
        }
        location.reload();
    }

    $effect(() => {
        value, request_save();
    });

    let enable_anim = storage("writer::enable_anim", true);

    const s_header_btn = "button button-base text-(sm hue-11)";
    const s_toggle_btn =
        "flex-1 button button-detail justify-center py-2 tint toggled:hue-prim";
    const s_h1 = "my-4 py-2 border-b-(2 solid hue-4A) text-2xl font-bold";
    const s_h2 = "my-3 py-2 text-xl font-bold";
    const s_h3 =
        "hue-prim my-2 py-1 px-4 bg-hue-4A border-l-(4 solid hue-10) text-hue-12 font-bold";
    const s_p = "py-2 text-hue-11";
    const s_a = "text-prim-10 font-bold";
</script>

<svelte:head>
    <title>Succubus Writer</title>
</svelte:head>

<Basic class="p-0! md:dark:bg-hue-2">
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
                            这是一个辅助写作的在线应用，主要提供文本自动补全和
                            AI 输入法等功能。
                        </p>
                        <p class={s_p}>
                            同时，该应用的所有功能是完全本地的，不会采集用户的任何数据，你可以放心使用。
                        </p>
                        <h2 class={s_h2}>功能介绍</h2>
                        <h3 class={s_h3}>自动补全</h3>
                        <p class={s_p}>
                            当你进行任何输入时，就会触发自动补全功能。
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
                        </p>
                        <p class={s_p}>
                            而上面显示的前向预测文本，则是多次选择最高概率备选项之后，可能出现的文本，
                            其预测长度可以在设置中调整，要注意的是，过高的长度可能会导致性能问题。
                        </p>
                        <h3 class={s_h3}>AI 输入法</h3>
                        <p class={s_p}>
                            当你关闭系统输入法或输入英文时，应用会自动启用 AI
                            输入法功能。
                        </p>
                        <p class={s_p}>
                            当你键入任何字母时，该字母不会输入到文档，而是暂存到输入法的暂存区，
                            该暂存区显示在前向预测区域之上。
                        </p>
                        <p class={s_p}>
                            当输入法暂存了大于一个字母时，就会暂时禁用默认盲猜的自动补全，
                            而是转而使用基于码表的混合自动补全，一般来说，混合自动补全的准确率要远远大于盲猜，
                            而且当当前的补全不准确时，可以多录入几个字母来让自动补全基于后面的输入来修正之前的预测，
                            最长可暂存字母取决于设置的预测长度，基本上越长输入就越准确，
                            但是和盲猜预测一样，过高的长度会导致性能问题。
                        </p>
                        <p class={s_p}>
                            当在暂存区已满的情况下继续输入时，输入法会将第一个最佳预测输入到文档，
                            并清除第一个暂存字母来为新的输入留出空间。
                            另外，当在暂存区有字母的情况下输入任意非字母符号时，
                            输入法会将所有的前向预测序列一次性输入到文档，类似于某些输入法的顶功功能。
                            使用空格也可以将所有前向预测一次性输入，但不会输入盲猜的前向预测。
                        </p>
                        <p class={s_p}>
                            对于输入使用的码表，当前的默认选项是星空键道6的单字码表，你可以在
                            <a
                                class={s_a}
                                target="_blank"
                                href="https://xkinput.github.io/"
                            >
                                这里
                            </a>
                            找到相关资料，而其它的码表正在开发中。
                        </p>
                        <p class={s_p}>
                            另外，在启用 AI
                            输入法时，所有的半角字符会被自动转换为全角，
                            但引号基于特殊原因无法转换，你可以使用「」（左右方括号输入）代替，
                            或者启用引号替用选项来使用方括号输入中文引号。
                        </p>
                        <h2 class={s_h2}>码表介绍</h2>
                        <h3 class={s_h3}>键道6</h3>
                        <p class={s_p}>
                            该码表使用了星空键道6的单字码表作为参考，
                            但是和键道6的1~4码对1字不同，该码表为1码1字，
                            因此可以实现「敲键即上字的效果」。
                        </p>
                        <p class={s_p}>
                            作为代价，当需要输入生僻字或专有名词时就比较困难，
                            遇到这种情况，你可以切换到系统输入法应对。
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
                    <div class="lt-md:box-fill md:box p-4 gap-4">
                        <div class="font-bold">权重选择</div>
                        <div class="flex gap-2">
                            <ToggleButton
                                class={s_toggle_btn}
                                bind:tree={$model_name}
                                value="model"
                                required
                            >
                                <div>通用模型</div>
                                <div class="flex-1 text-sm op-50">
                                    GPT 模型 速度较慢
                                </div>
                            </ToggleButton>
                        </div>
                        <div class="font-bold">预测长度</div>
                        <div class="flex gap-2">
                            {#each Array(10) as _, i}
                                <ToggleButton
                                    class={s_toggle_btn}
                                    bind:tree={$predict_len}
                                    value={i + 1}
                                    required
                                >
                                    {i + 1}
                                </ToggleButton>
                            {/each}
                        </div>
                        <div class="font-bold">输入法码表</div>
                        <div class="flex gap-2">
                            <!-- <ToggleButton class={s_toggle_btn}>
                                拼音
                            </ToggleButton> -->
                            <ToggleButton class={s_toggle_btn} required>
                                键道6
                            </ToggleButton>
                        </div>
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
                        <div class="font-bold">输入动画</div>
                        <div class="flex gap-2">
                            <ToggleButton
                                class={s_toggle_btn}
                                bind:tree={$enable_anim}
                                value={false}
                                required>禁用</ToggleButton
                            >
                            <ToggleButton
                                class={s_toggle_btn}
                                bind:tree={$enable_anim}
                                value={true}
                                required>启用</ToggleButton
                            >
                        </div>
                        <button
                            class="hue-err button tint mt-auto p-2 text-(center hue-11)"
                            onclick={reset_config}
                        >
                            全部重置
                        </button>
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
                {onbeforeinput}
                {onclick}
                oncompositionstart={() => (enable = false)}
                oncompositionend={() => ((enable = true), oninput())}
            />
        </div>
        <div
            bind:this={ime_elem}
            bind:contentRect={ime_rect}
            class="
                box divide-(y solid base-4A) text-(base hue-12) overflow-hidden
                light:(hue-green bg-hue-4) md:dark:(bg-hue-2)
                lt-md:shadow-base-y md:(fixed card)"
            style="
                left: {ime_pos.x}px;
                top: {ime_pos.y}px;
                opacity: {ime_tar.disable ? '0' : '1'}"
            class:hide={ime_tar.disable}
            class:transition-all-200={$enable_anim}
        >
            {#if !hide && enable && predictions}
                {@const { linear, branch } = predictions}
                <div
                    class="
                        flex items-center px-2
                        lt-md:(text-base h-7 lh-7) md:(text-sm h-6 lh-6)"
                >
                    {#if code.length > 0}
                        <div class="lt-md:w-6 md:w-4 text-center">
                            {code[0]}
                        </div>
                    {/if}
                    {#each code.slice(1) as c}
                        <div class="lt-md:w-6 md:w-4 op-50 text-center">
                            {c}
                        </div>
                    {/each}
                    <div class="h-4 border-r-(1 solid prim-10)"></div>
                </div>
                <div
                    class="
                    flex px-2 lh-7
                    lt-md:(text-xl h-9 lh-9) md:(text-base h-7 lh-7)"
                >
                    <div class="lt-md:w-6 md:w-4 text-center">{linear[0]}</div>
                    {#each linear.slice(1).padEnd($predict_len - 1, " ") as c}
                        <div class="lt-md:w-6 md:w-4 op-50 text-center">
                            {c}
                        </div>
                    {/each}
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
                            onmousedown={(e) => e.preventDefault()}
                            onmouseup={(e) => e.preventDefault()}
                            onpointerdown={(e) => {
                                fill(pred[0]);
                                code = code.slice(1);
                                e.preventDefault();
                            }}
                            onpointerup={(e) => e.preventDefault()}
                        >
                            <div class="op-50 lt-md:hidden">
                                {key}
                            </div>
                            <div class="flex-1">
                                {pred}
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</Basic>
