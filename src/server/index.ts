import { Hono } from "hono";
import { getServerEnv } from "@/lib/validation/env";
import roomRoutes from "./routes/room";
import uploadRoutes from "./routes/upload";
import cloneRoutes from "./routes/clone";
import chatRoutes from "./routes/chat";
import exportRoutes from "./routes/export";

const app = new Hono().basePath("/api");

app.use("*", async (_c, next) => {
  getServerEnv();
  await next();
});

app.get("/health", (c) => c.json({ ok: true }));

app.route("/rooms", roomRoutes);
app.route("/upload", uploadRoutes);
app.route("/clone", cloneRoutes);
app.route("/chat", chatRoutes);
app.route("/export", exportRoutes);

export default app;
