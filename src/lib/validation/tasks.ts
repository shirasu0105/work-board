import { z } from "zod";
import { requiredText, optionalText, optionalDate } from "./common";
import { TASK_STATUSES } from "@/lib/constants";

export const taskInputSchema = z.object({
  name: requiredText("タスク名", 200),
  categoryId: requiredText("カテゴリ", 100),
  projectId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  dueDate: optionalDate(),
  plannedDate: optionalDate(),
  memo: optionalText(2000),
  status: z.enum(TASK_STATUSES),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
