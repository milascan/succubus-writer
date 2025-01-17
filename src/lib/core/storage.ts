import { writable } from "svelte/store";

export const storage = (id, value = null) => {
    const local_value = localStorage.getItem(id);
    value = local_value ? JSON.parse(local_value) : value;
    const store = writable(value);
    store.subscribe((v) => {
        localStorage.setItem(id, JSON.stringify(v));
    });
    return store;
};