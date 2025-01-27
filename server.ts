import { Database } from "bun:sqlite";

const db = new Database("pages.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    html TEXT,
    css TEXT,
    components TEXT
  );
`);

// Public endpoint to serve landing pages
const servePage = (id: string) => {
  const page = db.query(`SELECT html, css FROM pages WHERE id = $id`).get({ $id: id });
  if (!page) return new Response("Page not found", { status: 404 });
  
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>${page.css}</style>
      </head>
      <body>${page.html}</body>
    </html>
  `, { headers: { "Content-Type": "text/html" } });
};

// Bun server
const server = Bun.serve({
    hostname: "0.0.0.0",
    port: 8081,
    async fetch(req) {
        const url = new URL(req.url);

        // Public landing pages
        if (url.pathname.startsWith("/page/")) {
        const id = url.pathname.split("/").pop();
        return servePage(id);
        }

        // Editor API (localhost-only)
        if (url.pathname.startsWith("/api/")) {
        // Block remote access to API
        const isLocal = req.headers.get("host")?.startsWith("localhost");
        if (!isLocal) return new Response("Forbidden", { status: 403 });

        // Save endpoint
        if (url.pathname === "/api/save" && req.method === "POST") {
            const { html, css, components } = await req.json();
            const id = crypto.randomUUID();
            db.query(`
            INSERT INTO pages (id, html, css, components)
            VALUES ($id, $html, $css, $components)
            `).run({ $id: id, $html: html, $css: css, $components: components });
            return new Response(JSON.stringify({ id }));
        }

        // Load endpoint
        if (url.pathname.startsWith("/api/load/") && req.method === "GET") {
            const id = url.pathname.split("/").pop();
            const page = db.query(`SELECT * FROM pages WHERE id = $id`).get({ $id: id });
            return new Response(JSON.stringify(page || {}));
        }
        }

        // Serve editor UI (public)
        return new Response(Bun.file("index.html"));
    },
});

console.log(`Server running at ${server.url}`);