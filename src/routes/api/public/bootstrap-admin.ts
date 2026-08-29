import { createFileRoute } from "@tanstack/react-router";

const TOKEN = "bootstrap-cuideja-2026";

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
        const url = process.env["SUPABASE_URL"]!;
        const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
        const h = {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        };

        const listRes = await fetch(
          `${url}/auth/v1/admin/users?per_page=200`,
          { headers: h },
        );
        const list = (await listRes.json()) as { users?: Array<{ id: string; email?: string }> };
        let user = (list.users ?? []).find(
          (u) => u.email?.toLowerCase() === email.toLowerCase(),
        );

        if (!user) {
          const createRes = await fetch(`${url}/auth/v1/admin/users`, {
            method: "POST",
            headers: h,
            body: JSON.stringify({
              email,
              password,
              email_confirm: true,
              user_metadata: { nome: "Administrador", tipo: "admin" },
            }),
          });
          if (!createRes.ok) {
            return new Response(await createRes.text(), { status: 500 });
          }
          user = (await createRes.json()) as { id: string; email?: string };
        } else {
          await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
            method: "PUT",
            headers: h,
            body: JSON.stringify({ password, email_confirm: true }),
          });
        }

        const roleRes = await fetch(`${url}/rest/v1/user_roles`, {
          method: "POST",
          headers: { ...h, Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ user_id: user.id, role: "admin" }),
        });
        const roleText = await roleRes.text();

        return Response.json({
          userId: user.id,
          email,
          roleStatus: roleRes.status,
          roleText,
        });
      },
    },
  },
});
