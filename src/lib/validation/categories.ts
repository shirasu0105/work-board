import { z } from "zod";
import { requiredText, optionalText } from "./common";

export const categoryInputSchema = z.object({
  name: requiredText("カテゴリ名", 100),
  description: optionalText(500),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
