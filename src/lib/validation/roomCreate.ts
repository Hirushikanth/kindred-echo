import { z } from "zod";

/** Memory profile stored as JSON — arrays default empty for predictable Supabase payloads. */
export const memoryProfileSchema = z.object({
  occupation: z.string().trim().max(200).optional(),
  hobbies: z.array(z.string().max(80)).max(80).default([]),
  favoriteSayings: z.array(z.string().max(500)).max(40).default([]),
  importantMemories: z.array(z.string().max(2000)).max(80).default([]),
  familyMembers: z.array(z.string().max(120)).max(80).default([]),
  avoidTopics: z.array(z.string().max(200)).max(80).default([]),
  speakingStyleNotes: z.array(z.string().max(500)).max(40).default([]),
});

export const createRoomSchema = z.object({
  lovedOneName: z.string().trim().min(1).max(120),
  relationship: z.string().trim().min(1).max(120),
  familyMemberName: z.string().trim().min(1).max(120),
  /** ISO-8601 from client when consent completed */
  consentAt: z.string().datetime({ offset: true }),
  memoryProfile: memoryProfileSchema,
});

export type CreateRoomPayload = z.infer<typeof createRoomSchema>;
