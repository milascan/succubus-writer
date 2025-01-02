<script>
    let {
        value = $bindable(0),
        field = $bindable(),
        class: klass,
        ...rest
    } = $props();
</script>

<textarea class={klass} bind:this={field} bind:value {...rest}></textarea>

<style>
    @layer components {
        textarea {
            all: unset;
            display: block;
            height: auto;
            border: none;
            background: none;
            font: inherit;
            color: inherit;
            outline: none;
        }
    }
</style>
