import "@unocss/reset/tailwind.css";
import "uno.css";
import { decode, encode } from "$lib/utils.ts";

export const load = () => {
  return {
    api: async (url, data = null, opts = {}) => {
      let res;
      try {
        res = await fetch(url, {
          ...opts,
          method: "POST",
          body: encode(data),
          headers: {
            "Content-Type": "application/octet-stream",
            ...(opts.headers ?? []),
          },
        });
      } catch (_) {
        throw "无法连接到服务器";
      }
      if (!res.ok) {
        throw (await res.json())?.message ?? `请求失败: ${res.status}`;
      }
      try {
        const data = decode(new Uint8Array(await res.arrayBuffer()));
        return data;
      } catch (e) {
        throw `解析失败: ${e}`;
      }
    },
  };
};
