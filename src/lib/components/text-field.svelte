<script>
    let {
        value = $bindable(""),
        field = $bindable(),
        class: klass = "",
        "class-field": class_field = "",
        ...rest
    } = $props();

    export function insert(pos, text) {
        value = value.slice(0, pos) + text + value.slice(pos);
    }

    export function focus() {
        field.focus();
    }

    export function get_cursor() {
        return [field.selectionStart, field.selectionEnd];
    }

    export function set_cursor(start, end = start) {
        field.selectionStart = start;
        field.selectionEnd = end;
    }

    let dummy_elem = $state();

    export function get_cursor_rect() {
        const range = document.createRange();
        const tar = dummy_elem.firstChild ?? dummy_elem;
        const [start, end] = get_cursor();
        range.setStart(tar, start);
        range.setEnd(tar, end);
        return [...range.getClientRects()].at(-1);
    }
</script>

<div class="root {klass}">
    <pre
        bind:this={dummy_elem}
        class="textarea {class_field} op-0 pointer-events-none">{value}​</pre>
    <textarea
        class="textarea {class_field}"
        bind:value
        bind:this={field}
        {...rest}
    ></textarea>
</div>

<style>
    @layer components {
        .root {
            position: relative;
        }
        .textarea {
            all: unset;
            display: block;
            height: auto;
            border: none;
            background: none;
            font: inherit;
            color: inherit;
            outline: none;
            white-space: pre;
            position: absolute;
            inset: 0;
        }
    }
</style>
