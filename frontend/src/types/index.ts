export type TaskStatus = "pending" | "in_progress" | "done";

export interface Reporter {
  id:   string;
  name: string;
}

export interface Task {
  id:     string;
  /** タスクタイトル */
  text:   string;
  /** タスク詳細 */
  description?: string;
  status: TaskStatus;
  parentId: string | null;
  children: Task[];
  /** 担当者 */
  assignee?: Reporter;
  /** 発行日時（自動入力） */
  createdAt: string;
  /** 期限 */
  dueDate?: string;
  /** 起票者 */
  reporter?: Reporter;
  /**
   * 親以外の依存タスクID一覧。
   * ツリーでは点線エッジで表示される。
   */
  extraDependencies?: string[];
}

export interface User {
  id:        string;
  name:      string;
  email:     string;
  avatarUrl?: string;
}

export interface Project {
  id:          string;
  name:        string;
  description?: string;
  ownerId:     string;
  members:     User[];
  tasks:       Task[];
  createdAt:   string;
}

// ── Form data shape ───────────────────────────────────────────
export interface TaskFormData {
  text:               string;
  description:        string;
  dueDate:            string;
  parentId:           string | null;
  extraDependencies:  string[];
  reporter:           Reporter;
  /** null = 担当者なし */
  assignee:           Reporter | null;
}
