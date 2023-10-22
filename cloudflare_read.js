export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} ctx
   * @returns {Response}
   */
  async fetch(request, env, ctx) {
    console.log("Hello Cloudflare Workers!");
    let value = await env.posts.get("to-do:123");

    return new Response(welcome, {
      headers: {
        "content-type": "text/html",
      },
    });
  },
};