import { z } from "zod";
import { requiredText, optionalText, optionalDate } from "./common";

export const somedayInputSchema = z.object({
  content: requiredText("内容", 300),
  categoryId: requiredText("カテゴリ", 100),
  reason: optionalText(1000),
  reviewDate: optionalDate(),
});

export type SomedayInput = z.infer<typeof somedayInputSchema>;
