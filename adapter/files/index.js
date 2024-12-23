import { Server } from "SERVER";
import { manifest } from "MANIFEST";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serveDir } from "@std/http";

const dir = join(dirname(fileURLToPath(import.meta.url)), "client");

const server = new Server(manifest);
await server.init({ env: {} });

export default {
  async fetch(request) {
    const response = await serveDir(request, {
      fsRoot: dir,
      quiet: true,
    });
    if (response.status < 400) {
      return response;
    } else {
      const response = await server.respond(request, {
        platform: { info: "deno" },
      });
      return response;
    }
  },
};
