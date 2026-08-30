import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pubkey")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (
          request.headers.get("x-bootstrap-token") !== "bootstrap-cuideja-2026"
        ) {
          return new Response("Unauthorized", { status: 401 });
        }
        return Response.json({
          publishable: process.env["MEU_SUPABASE_PUBLISHABLE_KEY"] ?? null,
        });
      },
    },
  },
});
