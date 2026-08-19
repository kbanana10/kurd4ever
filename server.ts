import express from "express";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import http from "http";
import fs from "fs";
import path from "path";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable HTTP compression for all text-based responses (JS, CSS, JSON, HTML)
app.use(compression());

const IS_PROD = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));

// Hardening security headers (nosniff, frame, referrer, permissions, CSP).
// AUDIT FIX (full-app sweep): in dev, Vite's HMR websocket (port 24678) was
// blocked by connect-src, printing a CSP violation on EVERY page load — the
// only recurring console error in the app. Allow ws:/wss: in dev only; the
// production policy is unchanged.
const CSP_CONNECT_DEV = IS_PROD ? "" : " ws: wss:";
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; media-src 'self' data: blob: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.run.app https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://script.google.com" + CSP_CONNECT_DEV + "; frame-src 'self' https://*.firebaseapp.com https://*.google.com;"
  );
  next();
});

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

async function startServer() {
  app.use(
    "/audio",
    express.static(AUDIO_DIR, {
      // Let the JSON 404 handler below respond to missing generated TTS files.
      // fallthrough:false turns routine misses into noisy ENOENT backend errors.
      fallthrough: true,
      maxAge: IS_PROD ? "30d" : 0,
    })
  );
  // Surface missing audio as JSON 404 rather than the SPA shell.
  app.use("/audio", (_req, res) => res.status(404).json({ error: "Audio asset not found" }));

  // 426-FIX: create the HTTP server explicitly so Vite's HMR WebSocket can
  // SHARE it. In plain middlewareMode Vite cannot see Express's implicit
  // server and spawns a standalone WS server on 0.0.0.0:24678 — a port that
  // answers every normal HTTP request with "426 Upgrade Required" (and gets
  // picked up as a bogus "preview" in hosted sandboxes → white page). With a
  // shared server, WebSocket *upgrade* requests ride port 3000 next to
  // regular page traffic: Node routes 'upgrade' events to Vite's WS handler
  // while Express keeps serving HTTP — HMR works same-origin through any
  // proxy, and no stray port exists at all.
  const httpServer = http.createServer(app);

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Preserve the DISABLE_HMR contract from vite.config.ts.
        hmr: process.env.DISABLE_HMR === "true" ? false : { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { maxAge: "1y", index: false }));
    app.use(express.static(path.join(process.cwd(), "public"), { maxAge: "1d", index: false }));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
