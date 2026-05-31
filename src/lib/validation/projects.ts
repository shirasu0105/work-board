import { z } from "zod";
import { requiredText, optionalText, optionalDate } from "./common";

export const projectInputSchema = z.object({
  name: requiredText("プロジェクト名", 150),
  categoryId: requiredText("カテゴリ", 100),
  purpose: optionalText(1000),
  completionCondition: optionalText(1000),
  dueDate: optionalDate(),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
