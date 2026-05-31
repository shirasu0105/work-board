import { z } from "zod";
import { requiredText, optionalText, optionalDate } from "./common";

/** 待ち開始時の必須/任意項目（SPEC §3.3）。 */
export const waitingInputSchema = z.object({
  waitingFor: requiredText("待ち相手", 150),
  waitingReason: requiredText("待ち理由", 500),
  waitingCheckDate: optionalDate(),
  waitingRequestMemo: optionalText(1000),
});

export type WaitingInput = z.infer<typeof waitingInputSchema>;

/** 待ち解除時の任意項目。 */
export const waitingReleaseSchema = z.object({
  status: z.enum(["未着手", "対応中"]),
  waitingReplyMemo: optionalText(1000),
});

export type WaitingReleaseInput = z.infer<typeof waitingReleaseSchema>;
