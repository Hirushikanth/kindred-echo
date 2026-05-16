import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { createRoomSchema } from "@/lib/validation/roomCreate";
import { createServiceSupabase } from "@/server/storage/supabase-service";
import { ROOM_COOKIE_NAME } from "@/lib/constants/session";

const roomRoutes = new Hono();

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; /* 7d */

roomRoutes.post("/", async (c) => {
  const requestId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  c.header("x-request-id", requestId);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = createRoomSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const first =
      flat.fieldErrors.lovedOneName?.[0] ??
      flat.fieldErrors.relationship?.[0] ??
      flat.fieldErrors.familyMemberName?.[0] ??
      flat.fieldErrors.consentAt?.[0] ??
      "Request validation failed";
    return c.json({ error: first }, 400);
  }

  const dto = parsed.data;

  let supabase;
  try {
    supabase = createServiceSupabase();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server misconfigured";
    return c.json({ error: msg }, 503);
  }

  const { lovedOneName, relationship, familyMemberName, consentAt, memoryProfile } =
    dto;

  const { data, error } = await supabase
    .from("family_rooms")
    .insert({
      consent_accepted_at: consentAt,
      loved_one_name: lovedOneName,
      relationship,
      family_member_name: familyMemberName,
      memory_profile: memoryProfile,
      status: "setup",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    const detail =
      process.env.NODE_ENV === "development"
        ? { detail: error?.message ?? null }
        : {};
    return c.json(
      {
        error: "Could not create room",
        ...detail,
      },
      502
    );
  }

  const roomId = data.id as string;
  const prod = process.env.NODE_ENV === "production";

  setCookie(c, ROOM_COOKIE_NAME, roomId, {
    httpOnly: true,
    secure: prod,
    sameSite: "Lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return c.json({ roomId });
});

export default roomRoutes;
