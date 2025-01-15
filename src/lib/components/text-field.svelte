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
        const raw_rect = [...range.getClientRects()].at(-1);
        const rect = {
            x: raw_rect.x,
            y: raw_rect.y,
            width: raw_rect.width,
            height: raw_rect.height,
            bottom: raw_rect.bottom,
            left: raw_rect.left,
            right: raw_rect.right,
            top: raw_rect.top,
        };
        const offset_x = field.scrollLeft;
        const offset_y = field.scrollTop;
        if (rect) {
            rect.x -= offset_x;
            rect.left -= offset_x;
            rect.y -= offset_y;
            rect.top -= offset_y;
        }
        return rect;
    }

    export function is_end() {
        return get_cursor()[0] === value.length;
    }
</script>

<div class="root {klass}">
    <pre
        bind:this={dummy_elem}
        class="textarea {class_field} op-0 pointer-events-none">{value}​</pre>
    <textarea
        class="textarea pos-absolute inset-0 overflow-hidden {class_field}"
        bind:value
        bind:this={field}
        {...rest}
    ></textarea>
</div>

<style>
    @layer components {
        .root {
            position: relative;
            height: fit-content !important;
            min-height: fit-content !important;
        }
        .textarea {
            all: unset;
            display: block;
            border: none;
            background: none;
            font: inherit;
            color: inherit;
            outline: none;
            resize: none !important;
            white-space: pre;
            word-break: break-word;
        }
    }
</style>
