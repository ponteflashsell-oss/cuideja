import { createFileRoute } from "@tanstack/react-router";

const TOKEN = "bootstrap-cuideja-2026";
const PROJECT_URL = "https://jwfaxfgothgrlixfyfad.supabase.co";

export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("x-bootstrap-token") !== TOKEN) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { email, password } = (await request.json()) as {
          email: string;
          password: string;
        };
        const key = process.env["MEU_SUPABASE_SERVICE_ROLE_KEY"];
        if (!key) return new Response("missing key", { status: 500 });
        const h = {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        };
        const out: Record<string, unknown> = {};

        const listRes = await fetch(
          `${PROJECT_URL}/auth/v1/admin/users?per_page=200`,
          { headers: h },
        );
        const list = (await listRes.json()) as {
          users?: Array<{ id: string; email?: string }>;
        };
        out["listStatus"] = listRes.status;
        let user = (list.users ?? []).find(
          (u) => u.email?.toLowerCase() === email.toLowerCase(),
        );

        if (!user) {
          const createRes = await fetch(`${PROJECT_URL}/auth/v1/admin/users`, {
            method: "POST",
            headers: h,
            body: JSON.stringify({
              email,
              password,
              email_confirm: true,
              user_metadata: { nome: "Administrador", tipo: "admin" },
            }),
          });
          const created = await createRes.text();
          out["createStatus"] = createRes.status;
          if (!createRes.ok) {
            out["createBody"] = created;
            return Response.json(out, { status: 500 });
          }
          user = JSON.parse(created) as { id: string; email?: string };
        } else {
          const upd = await fetch(
            `${PROJECT_URL}/auth/v1/admin/users/${user.id}`,
            {
              method: "PUT",
              headers: h,
              body: JSON.stringify({ password, email_confirm: true }),
            },
          );
          out["updateStatus"] = upd.status;
        }
        out["userId"] = user.id;

        const roleRes = await fetch(`${PROJECT_URL}/rest/v1/user_roles`, {
          method: "POST",
          headers: { ...h, Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ user_id: user.id, role: "admin" }),
        });
        out["roleStatus"] = roleRes.status;
        out["roleBody"] = await roleRes.text();

        return Response.json(out);
      },
    },
  },
});
