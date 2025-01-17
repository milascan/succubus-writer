import { valid } from "$lib/utils.ts";
import { SvelteMap } from "svelte/reactivity";
import { array_to_poped } from "$lib/utils.ts";

export type Path<TK> = TK[];

class Node<TK, TV> extends SvelteMap<TK, (TV | Node<TK, TV>)> {}
class StaticNode<TK, TV> extends Map<TK, (TV | StaticNode<TK, TV>)> {}

const resolve_node = <TK, TV>(
    data: Node<TK, TV>,
    path: Path<TK>,
    make_node = false,
) => {
    const handle = (data: Node<TK, TV>, path: Path<TK>) => {
        if (path.length > 0) {
            const head = path[0];
            let node = data.get(head);
            if (node && node instanceof Node) {
                return handle(node, path.slice(1));
            } else {
                if (make_node) {
                    node = new Node<TK, TV>();
                    data.set(head, node);
                    return handle(node as Node<TK, TV>, path.slice(1));
                } else {
                    return undefined;
                }
            }
        } else {
            return data;
        }
    };
    return handle(data, path);
};

const resolve_static = <TK, TV>(
    data: StaticNode<TK, TV>,
    path: Path<TK>,
    make_node = false,
) => {
    const handle = (data: StaticNode<TK, TV>, path: Path<TK>) => {
        if (path.length > 0) {
            const head = path[0];
            let node = data.get(head);
            if (node && node instanceof StaticNode) {
                return handle(node, path.slice(1));
            } else {
                if (make_node) {
                    node = new StaticNode<TK, TV>();
                    data.set(head, node);
                    return handle(node as StaticNode<TK, TV>, path.slice(1));
                } else {
                    return undefined;
                }
            }
        } else {
            return data;
        }
    };
    return handle(data, path);
};

export class Tree<TK = unknown, TV = unknown> {
    #data: Node<TK, TV>;
    #path: Path<TK>;

    constructor(data = new Node<TK, TV>(), path: Path<TK> = []) {
        this.#data = data;
        this.#path = path;
    }

    static from<TK = unknown, TV = unknown>(entries: [Path<TK>, TV?][]) {
        const tree = new this<TK, TV | true>();
        for (const [path, val] of entries) {
            tree.set(path, val ?? true);
        }
        return tree;
    }

    #resolve(path: Path<TK>, make_node = false) {
        return resolve_node(this.#data, this.#path.concat(path), make_node);
    }
    has(path: Path<TK>) {
        const [head, key] = array_to_poped(path);
        const parent = this.#resolve(head);
        return !!parent && parent.has(key!);
    }
    get(path: Path<TK>) {
        const [head, key] = array_to_poped(path);
        const parent = this.#resolve(head);
        return parent && parent.get(key!);
    }
    size(path: Path<TK> = []) {
        const node = this.#resolve(path);
        return node ? node.size : 0;
    }
    set(path: Path<TK>, val: TV) {
        if (!valid(val)) return this.delete(path);
        const [head, key] = array_to_poped(path);
        const parent = this.#resolve(head, true);
        return parent && parent.set(key!, val);
    }
    delete(path: Path<TK> = []) {
        const handle = (data: Node<TK, TV>, path: Path<TK>): boolean => {
            const head = path[0];
            if (path.length > 1) {
                const node = data.get(head);
                if ((node && node instanceof Node)) {
                    const res = handle(node as Node<TK, TV>, path.slice(1));
                    if (node.size === 0) data.delete(head);
                    return res;
                } else {
                    return false;
                }
            } else {
                return data.delete(head);
            }
        };
        const abs_path = this.#path.concat(path);
        if (abs_path.length > 0) {
            return handle(this.#data, this.#path.concat(path));
        } else return this.#data.clear();
    }
    clear() {
        return this.delete();
    }
    subtree(path: Path<TK> = []) {
        return new Tree(this.#data, path);
    }
    entries(path: Path<TK> = [], keep = false) {
        const cvt = (
            data: Node<TK, TV> | TV,
            path: Path<TK>,
        ): [Path<TK>, TV][] =>
            data instanceof Node
                ? ([...data.entries()].flatMap((
                    [k, v]: [TK, TV | Node<TK, TV>],
                ) => cvt(v, path.concat([k]))))
                : [[path, data]];
        const node = this.#resolve(path);
        return node ? cvt(node, keep ? path : []) : [];
    }
    paths(path: Path<TK> = [], depth = Infinity, keep = false) {
        const cvt = (
            data: Node<TK, TV> | TV,
            path: Path<TK>,
            dep: number,
        ): Path<TK>[] =>
            data instanceof Node && dep < depth
                ? ([...data.entries()].flatMap((
                    [k, v]: [TK, TV | Node<TK, TV>],
                ) => cvt(v, path.concat([k]), dep + 1)))
                : [path];
        const node = this.#resolve(path);
        return node ? cvt(node, keep ? path : [], 0) : [];
    }
    values(path: Path<TK> = [], keep = false) {
        return this.entries(path, keep).map(([, v]) => v);
    }
    to_obj(path: Path<TK> = []) {
        const cvt = (data: Node<TK, TV> | TV): object =>
            data instanceof Node
                ? Object.fromEntries(
                    data.entries().map((
                        [k, v]: [TK, TV | Node<TK, TV>],
                    ) => [k, cvt(v)]),
                )
                : data;
        const node = this.#resolve(path);
        return node ? cvt(node) : {};
    }
}

export class StaticTree<TK = unknown, TV = unknown> {
    #data: StaticNode<TK, TV>;
    #path: Path<TK>;

    constructor(data = new StaticNode<TK, TV>(), path: Path<TK> = []) {
        this.#data = data;
        this.#path = path;
    }

    static from<TK = unknown, TV = unknown>(entries: [Path<TK>, TV?][]) {
        const tree = new this<TK, TV | true>();
        for (const [path, val] of entries) {
            tree.set(path, val ?? true);
        }
        return tree;
    }

    #resolve(path: Path<TK>, make_node = false) {
        return resolve_static(this.#data, this.#path.concat(path), make_node);
    }
    has(path: Path<TK>) {
        const [head, key] = array_to_poped(path);
        const parent = this.#resolve(head);
        return !!parent && parent.has(key!);
    }
    get(path: Path<TK>) {
        const [head, key] = array_to_poped(path);
        const parent = this.#resolve(head);
        return parent && parent.get(key!);
    }
    size(path: Path<TK> = []) {
        const node = this.#resolve(path);
        return node ? node.size : 0;
    }
    set(path: Path<TK>, val: TV) {
        if (!valid(val)) return this.delete(path);
        const [head, key] = array_to_poped(path);
        const parent = this.#resolve(head, true);
        return parent && parent.set(key!, val);
    }
    delete(path: Path<TK> = []) {
        const handle = (data: StaticNode<TK, TV>, path: Path<TK>): boolean => {
            const head = path[0];
            if (path.length > 1) {
                const node = data.get(head);
                if ((node && node instanceof StaticNode)) {
                    const res = handle(
                        node as StaticNode<TK, TV>,
                        path.slice(1),
                    );
                    if (node.size === 0) data.delete(head);
                    return res;
                } else {
                    return false;
                }
            } else {
                return data.delete(head);
            }
        };
        const abs_path = this.#path.concat(path);
        if (abs_path.length > 0) {
            return handle(this.#data, this.#path.concat(path));
        } else return this.#data.clear();
    }
    subtree(path: Path<TK> = []) {
        return new StaticTree(this.#data, path);
    }
    entries(path: Path<TK> = [], keep = false) {
        const cvt = (
            data: StaticNode<TK, TV> | TV,
            path: Path<TK>,
        ): [Path<TK>, TV][] =>
            data instanceof StaticNode
                ? ([...data.entries()].flatMap((
                    [k, v]: [TK, TV | StaticNode<TK, TV>],
                ) => cvt(v, path.concat([k]))))
                : [[path, data]];
        const node = this.#resolve(path);
        return node ? cvt(node, keep ? path : []) : [];
    }
    paths(path: Path<TK> = [], depth = Infinity, keep = false) {
        const cvt = (
            data: StaticNode<TK, TV> | TV,
            path: Path<TK>,
            dep: number,
        ): Path<TK>[] =>
            data instanceof StaticNode && dep < depth
                ? ([...data.entries()].flatMap((
                    [k, v]: [TK, TV | StaticNode<TK, TV>],
                ) => cvt(v, path.concat([k]), dep + 1)))
                : [path];
        const node = this.#resolve(path);
        return node ? cvt(node, keep ? path : [], 0) : [];
    }
    values(path: Path<TK> = [], keep = false) {
        return this.entries(path, keep).map(([, v]) => v);
    }
    to_obj(path: Path<TK> = []) {
        const cvt = (data: StaticNode<TK, TV> | TV): object =>
            data instanceof StaticNode
                ? Object.fromEntries(
                    data.entries().map((
                        [k, v]: [TK, TV | StaticNode<TK, TV>],
                    ) => [k, cvt(v)]),
                )
                : data;
        const node = this.#resolve(path);
        return node ? cvt(node) : {};
    }
}

const s_cache = Symbol("s_cache");

export class CachedTree<TK = unknown, TV = unknown> extends StaticTree<TK, TV> {
    #sealed = true;
    #cache_entries = new StaticTree<TK | symbol, [Path<TK>, TV][]>();
    #cache_paths = new StaticTree<TK | number | symbol, Path<TK>[]>();
    #cache_values = new StaticTree<TK | symbol, TV[]>();
    #cache_to_obj = new StaticTree<TK | symbol, object>();

    static override from<TK = unknown, TV = unknown>(
        entries: [Path<TK>, TV?][],
    ) {
        const tree = new this<TK, TV | true>();
        tree.#sealed = false;
        for (const [path, val] of entries) {
            tree.set(path, val ?? true);
        }
        tree.#sealed = true;
        return tree;
    }

    #clean_cache(path: Path<TK>) {
        if (this.#sealed) {
            for (
                const cache of [
                    this.#cache_entries,
                    this.#cache_paths,
                    this.#cache_values,
                    this.#cache_to_obj,
                ]
            ) {
                if (cache.size() > 0) {
                    for (let i = 0; i < path.length - 1; i++) {
                        cache.delete([...path.slice(0, i + 1), s_cache]);
                    }
                    cache.delete(path);
                }
            }
        }
    }
    override set(path: Path<TK>, val: TV) {
        this.#clean_cache(path);
        return super.set(path, val);
    }
    override delete(path: Path<TK> = []) {
        this.#clean_cache(path);
        return super.delete(path);
    }
    override entries(path: Path<TK> = []) {
        const key = [...path, s_cache];
        const cache = this.#cache_entries.get(key);
        if (cache) {
            return cache as [Path<TK>, TV][];
        } else {
            const res = super.entries(path);
            this.#cache_entries.set(key, res);
            return res;
        }
    }
    override paths(path: Path<TK> = [], depth = Infinity) {
        const key = [...path, depth, s_cache];
        const cache = this.#cache_paths.get(key);
        if (cache) {
            return cache as Path<TK>[];
        } else {
            const res = super.paths(path);
            this.#cache_paths.set(key, res);
            return res;
        }
    }
    override values(path: Path<TK> = []) {
        const key = [...path, s_cache];
        const cache = this.#cache_values.get(key);
        if (cache) {
            return cache as TV[];
        } else {
            const res = super.values(path);
            this.#cache_values.set(key, res);
            return res;
        }
    }
    override to_obj(path: Path<TK> = []) {
        const key = [...path, s_cache];
        const cache = this.#cache_to_obj.get(key);
        if (cache) {
            return cache as object;
        } else {
            const res = super.to_obj(path);
            this.#cache_to_obj.set(key, res);
            return res;
        }
    }
}
