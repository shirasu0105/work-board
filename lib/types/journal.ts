/**
 * 日次ジャーナル関連の型定義（Phase 7 / 要件書 §10.12）。
 *
 * 日次ジャーナルは「対象日（暦日）」に一意。日付は YYYY-MM-DD のキー文字列で受け渡す。
 * API / Server から UI へは ISO 文字列 or 日付キーで正規化して渡す。
 */

import type { TaskDTO } from "./task";

/** API / Server から UI へ渡す日次ジャーナル DTO。 */
export type JournalDTO = {
  id: string;
  /** 対象日の日付キー（YYYY-MM-DD） */
  targetDate: string;
  /** 今日のひとこと（必須入力） */
  oneLiner: string;
  createdAt: string;
  updatedAt: string;
  /** 「明日やること」に選択されたタスク ID の一覧 */
  selectedTaskIds: string[];
};

/** ジャーナル画面の初期表示に必要なデータ束。 */
export type JournalPageData = {
  /** 対象日の日付キー */
  targetDate: string;
  /** 既存ジャーナル（未作成なら null） */
  journal: JournalDTO | null;
  /** 未完了タスク（明日やること候補） */
  undoneTasks: TaskDTO[];
  /** 対象日に完了したタスク */
  doneTasks: TaskDTO[];
};
