<script>
    let {
        value = $bindable(0),
        field = $bindable(),
        class: klass,
        ...rest
    } = $props();
</script>

<div
    class="textarea {klass}"
    bind:this={field}
    bind:textContent={value}
    {...rest}
    contenteditable="plaintext-only"
></div>

<style>
    @layer components {
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
        }
    }
</style>
