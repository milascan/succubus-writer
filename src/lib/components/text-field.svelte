<script>
    let { value = $bindable(0), class: klass, ...rest } = $props();
</script>

<textarea class={klass} bind:value {...rest}></textarea>

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
        }
    }
</style>
