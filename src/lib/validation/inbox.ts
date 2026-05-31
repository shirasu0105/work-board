import { z } from "zod";
import { requiredText } from "./common";

export const inboxInputSchema = z.object({
  content: requiredText("内容", 500),
});

export type InboxInput = z.infer<typeof inboxInputSchema>;
