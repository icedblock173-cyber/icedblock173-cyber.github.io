export default {
  async fetch(request, env, ctx) {
    return Response.json({
      message: "Hello from Pages!"
    });
  }
};
