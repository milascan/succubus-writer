import "./cron.server.js";

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const response = await resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace(
        "%unocss-svelte-scoped.global%",
        "unocss_svelte_scoped_global_styles",
      ),
  });
  response.headers.append("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.append("Cross-Origin-Embedder-Policy", "require-corp");
  return response;
}
