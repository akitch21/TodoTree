import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, FolderOpen, Loader2, Pencil, X } from "lucide-react";
import { TaskPanel, type ViewMode } from "@/components/dashboard/TaskPanel";
import TaskCrudTable from "@/components/project/TaskCrudTable";
import TaskFormPanel from "@/components/project/TaskFormPanel";
import TaskDetailView from "@/components/project/TaskDetailView";
import MemberEditor, { type ProjectMember } from "@/components/project/MemberEditor";
import TaskSidePanel from "@/components/project/TaskSidePanel";
import { applyFormToTree, updateTaskInTree, flattenTasks, addTaskToTree } from "@/lib/taskTree";
import { CURRENT_USER } from "@/lib/currentUser";
import { api } from "@/lib/api";
import type { Reporter, Task, TaskFormData, TaskStatus } from "@/types";

// ── API ↔ Task マッピング ──────────────────────────────────────

interface ApiTask {
  id: string;
  parent_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  children: ApiTask[];
}

function apiTaskToFrontend(t: ApiTask): Task {
  return {
    id:          t.id,
    text:        t.title,
    description: t.description || undefined,
    status:      t.status,
    parentId:    t.parent_id,
    children:    (t.children ?? []).map(apiTaskToFrontend),
    createdAt:   t.created_at,
    dueDate:     t.due_date ?? undefined,
  };
}

type ProjectStatus = "pending" | "in_progress" | "done";
interface ProjectInfo { name: string; description: string; status: ProjectStatus; }

function apiStatusToFrontend(s: string): ProjectStatus {
  if (s === "completed") return "done";
  if (s === "archived")  return "pending";
  return "in_progress";
}
function frontendStatusToApi(s: ProjectStatus): string {
  if (s === "done")    return "completed";
  if (s === "pending") return "archived";
  return "active";
}

// ── Right-panel state (tasks tab) ─────────────────────────────
type RightPane =
  | { type: "add";    parentId: string | null }
  | { type: "edit";   task: Task }
  | { type: "detail"; task: Task };

const DEFAULT_RIGHT: RightPane = { type: "add", parentId: null };

// ── Tree sliding-panel state ──────────────────────────────────
interface TreePanel {
  open:        boolean;
  contentType: "form" | "detail";
  task?:       Task;
}
const TREE_PANEL_CLOSED: TreePanel = { open: false, contentType: "form" };

// ── Tabs ──────────────────────────────────────────────────────
type Tab = "overview" | "tree" | "tasks" | "members";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "概要"       },
  { id: "tree",     label: "ツリー"     },
  { id: "tasks",    label: "タスク一覧" },
  { id: "members",  label: "メンバー"   },
];

// ── Page ─────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  // API からプロジェクト情報を取得
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError,   setPageError]   = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const projectName = projectInfo?.name ?? "";

  const [activeTab, setActiveTab] = useState<Tab>("tree");
  const [tasks,     setTasks]     = useState<Task[]>([]);
  const [viewMode,  setViewMode]  = useState<ViewMode>("tree");
  const [members,   setMembers]   = useState<ProjectMember[]>([]);

  // tasks の最新値を ref で保持（削除検出に使用）
  const tasksRef = useRef<Task[]>([]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  // TaskCrudTable の onChange ラッパー（削除されたタスクを API に反映）
  const handleTasksChange = useCallback((newTasks: Task[]) => {
    const previousTasks = tasksRef.current;
    const oldFlat = flattenTasks(previousTasks);
    const newFlat = flattenTasks(newTasks);
    const oldById = new Map(oldFlat.map((t) => [t.id, t]));
    const newById = new Map(newFlat.map((t) => [t.id, t]));
    const deletedIds = oldFlat.filter((t) => !newById.has(t.id)).map((t) => t.id);
    const statusUpdates = newFlat
      .filter((t) => oldById.get(t.id)?.status !== undefined && oldById.get(t.id)?.status !== t.status)
      .map((t) => ({ id: t.id, status: t.status }));

    setMutationError(null);
    setTasks(newTasks);
    void (async () => {
      try {
        await Promise.all(deletedIds.map((taskId) => api.delete(`/api/tasks/${taskId}`)));
        await Promise.all(statusUpdates.map(({ id: taskId, status }) =>
          api.patch(`/api/tasks/${taskId}`, { status })
        ));
      } catch {
        setTasks(previousTasks);
        setMutationError("タスクの保存に失敗しました。変更を元に戻しました。");
      }
    })();
  }, []);

  // マウント時に API からプロジェクトを取得
  useEffect(() => {
    if (!id) return;
    setPageLoading(true);
    setPageError(null);
    api.get(`/api/projects/${id}`)
      .then(({ data }) => {
        setProjectInfo({
          name:        data.name,
          description: data.description ?? "",
          status:      apiStatusToFrontend(data.status),
        });
        setTasks((data.tasks ?? []).map(apiTaskToFrontend));
        setMembers((data.members ?? []).map((m: { user_id: string; role: string }) => ({
          user: { id: m.user_id, name: "", email: "" },
          role: m.role as "owner" | "member",
        })));
      })
      .catch(() => {
        setPageError("プロジェクトの取得に失敗しました。再読み込みしてください。");
      })
      .finally(() => setPageLoading(false));
  }, [id]);
  const [rightPane,  setRightPane]  = useState<RightPane>(DEFAULT_RIGHT);
  const [treePanel,  setTreePanel]  = useState<TreePanel>(TREE_PANEL_CLOSED);

  const reporters = useMemo<Reporter[]>(() => [
    CURRENT_USER,
    ...members.map((m) => ({ id: m.user.id, name: m.user.name }))
              .filter((r) => r.id !== CURRENT_USER.id),
  ], [members]);

  // ── Task toggle & status change ──────────────────────────
  const toggleTask = useCallback((taskId: string) => {
    const previousTasks = tasksRef.current;
    const current = flattenTasks(previousTasks).find((t) => t.id === taskId);
    if (!current) return;

    const newStatus: TaskStatus = current.status === "done" ? "pending" : "done";
    setMutationError(null);
    setTasks(updateTaskInTree(previousTasks, taskId, { status: newStatus }));
    api.patch(`/api/tasks/${taskId}`, { status: newStatus }).catch(() => {
      setTasks(previousTasks);
      setMutationError("ステータス更新に失敗しました。変更を元に戻しました。");
    });
  }, []);

  const handleStatusChange = useCallback((taskId: string, status: TaskStatus) => {
    const previousTasks = tasksRef.current;
    setMutationError(null);
    setTasks(updateTaskInTree(previousTasks, taskId, { status }));
    api.patch(`/api/tasks/${taskId}`, { status }).catch(() => {
      setTasks(previousTasks);
      setMutationError("ステータス更新に失敗しました。変更を元に戻しました。");
    });
  }, []);

  // ── Tasks tab: right-pane handlers ───────────────────────
  const openDetail = useCallback((task: Task) =>
    setRightPane({ type: "detail", task }), []);

  const openEdit = useCallback((task: Task) =>
    setRightPane({ type: "edit", task }), []);

  const openAdd = useCallback((parentId: string | null) =>
    setRightPane({ type: "add", parentId }), []);

  const handleFormSubmit = useCallback(async (data: TaskFormData, editId?: string) => {
    setMutationError(null);
    if (editId) {
      await api.patch(`/api/tasks/${editId}`, {
        title:       data.text.trim(),
        description: data.description.trim() || "",
        due_date:    data.dueDate || null,
        parent_id:   data.parentId || null,
      });
      setTasks((prev) => applyFormToTree(prev, data, editId));
    } else {
      const { data: created } = await api.post<ApiTask>(`/api/tasks/project/${id}`, {
        title:       data.text.trim(),
        description: data.description.trim() || "",
        status:      "pending",
        parent_id:   data.parentId || null,
        due_date:    data.dueDate || null,
      });
      setTasks((prev) => addTaskToTree(prev, apiTaskToFrontend(created)));
    }
    setRightPane(DEFAULT_RIGHT);
  }, [id]);

  // ── Tree tab: sliding-panel handlers ─────────────────────
  const openTreeDetail = useCallback((task: Task) =>
    setTreePanel({ open: true, contentType: "detail", task }), []);

  const openTreeAdd = useCallback(() =>
    setTreePanel({ open: true, contentType: "form" }), []);

  const closeTreePanel = useCallback(() =>
    setTreePanel(TREE_PANEL_CLOSED), []);

  const openTreeEdit = useCallback((task: Task) =>
    setTreePanel({ open: true, contentType: "form", task }), []);

  const handleTreeFormSubmit = useCallback(async (data: TaskFormData, editId?: string) => {
    if (editId) {
      await api.patch(`/api/tasks/${editId}`, {
        title:       data.text.trim(),
        description: data.description.trim() || "",
        due_date:    data.dueDate || null,
        parent_id:   data.parentId || null,
      });
      setTasks((prev) => applyFormToTree(prev, data, editId));
    } else {
      const { data: created } = await api.post<ApiTask>(`/api/tasks/project/${id}`, {
        title:       data.text.trim(),
        description: data.description.trim() || "",
        status:      "pending",
        parent_id:   data.parentId || null,
        due_date:    data.dueDate || null,
      });
      setTasks((prev) => addTaskToTree(prev, apiTaskToFrontend(created)));
    }
    setTreePanel(TREE_PANEL_CLOSED);
  }, [id]);

  // Derive form initialData for the right panel
  const rightFormData = useMemo((): Partial<TaskFormData> & { createdAt?: string; id?: string } => {
    if (rightPane.type === "add")
      return { parentId: rightPane.parentId, reporter: CURRENT_USER };
    if (rightPane.type === "edit") {
      const t = rightPane.task;
      return {
        id: t.id, text: t.text, description: t.description ?? "",
        dueDate: t.dueDate ?? "", parentId: t.parentId,
        extraDependencies: t.extraDependencies ?? [],
        reporter: t.reporter ?? CURRENT_USER, createdAt: t.createdAt,
      };
    }
    return {};
  }, [rightPane]);

  // Derive form initialData for the tree sliding panel
  const treeFormData = useMemo((): Partial<TaskFormData> & { createdAt?: string; id?: string } => {
    if (!treePanel.task) return { reporter: CURRENT_USER };
    const t = treePanel.task;
    return {
      id: t.id, text: t.text, description: t.description ?? "",
      dueDate: t.dueDate ?? "", parentId: t.parentId,
      extraDependencies: t.extraDependencies ?? [],
      reporter: t.reporter ?? CURRENT_USER, createdAt: t.createdAt,
    };
  }, [treePanel.task]);

  // ── Loading / Error ────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">読み込み中...</span>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <AlertCircle size={24} className="text-destructive" />
        <p className="text-sm text-destructive">{pageError}</p>
        <Link to="/projects" className="text-xs text-muted-foreground underline">
          プロジェクト一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 px-6 pt-6 pb-4 shrink-0">
        <Link to="/projects"
          className="mt-1 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-0.5">
            <FolderOpen size={14} /><span>プロジェクト</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{projectName}</h1>
        </div>
      </div>

      {mutationError && (
        <div className="mx-6 mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={15} />
          <span>{mutationError}</span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b shrink-0 px-6">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            data-testid={"project-tab-" + tab.id}
            className={
              "px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px " +
              (activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground")
            }>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* ── ツリー ─────────────────────────────────────── */}
        {activeTab === "tree" && (
          <div className="h-full p-6 pb-0 flex flex-col">
            <TaskPanel
              tasks={tasks} viewMode={viewMode}
              onViewModeChange={setViewMode} onToggle={toggleTask}
              onStatusChange={handleStatusChange}
              projectName={projectName}
              onAddTask={openTreeAdd}
              onSelectTask={openTreeDetail}
            />
          </div>
        )}

        {/* ── タスク一覧 — 2カラム ─────────────────────── */}
        {activeTab === "tasks" && (
          <div className="flex h-full">
            {/* Left: table */}
            <div className="flex-1 min-w-0 overflow-y-auto p-6">
              <TaskCrudTable
                tasks={tasks} onChange={handleTasksChange}
                onAdd={openAdd}
                onEdit={(task) => openEdit(task)}
                onSelect={openDetail}
              />
            </div>

            {/* Divider */}
            <div className="w-px bg-border shrink-0" />

            {/* Right: detail or form */}
            <div className="w-[340px] shrink-0 overflow-y-auto p-6">
              {rightPane.type === "detail" ? (
                <TaskDetailView
                  task={rightPane.task}
                  allTasks={tasks}
                  onEdit={(task) => openEdit(task)}
                  onClose={() => setRightPane(DEFAULT_RIGHT)}
                  closeLabel="戻る"
                />
              ) : (
                <TaskFormPanel
                  mode={rightPane.type === "edit" ? "edit" : "create"}
                  initialData={rightFormData}
                  allTasks={tasks}
                  reporters={reporters}
                  onSubmit={handleFormSubmit}
                  onCancelEdit={() => setRightPane(DEFAULT_RIGHT)}
                />
              )}
            </div>
          </div>
        )}

        {/* ── 概要 ─────────────────────────────────────────── */}
        {activeTab === "overview" && id && projectInfo && (
          <div className="h-full overflow-y-auto p-6">
            <ProjectOverview
              project={projectInfo}
              tasks={tasks}
              onUpdate={(patch) => {
                const apiPatch: Record<string, string> = {};
                if (patch.status      !== undefined) apiPatch.status      = frontendStatusToApi(patch.status);
                if (patch.name        !== undefined) apiPatch.name        = patch.name;
                if (patch.description !== undefined) apiPatch.description = patch.description;
                setMutationError(null);
                api.patch(`/api/projects/${id}`, apiPatch).then(({ data }) => {
                  setProjectInfo({
                    name:        data.name,
                    description: data.description ?? "",
                    status:      apiStatusToFrontend(data.status),
                  });
                }).catch(() => {
                  setMutationError("プロジェクト情報の保存に失敗しました。");
                });
              }}
            />
          </div>
        )}

        {/* ── メンバー ───────────────────────────────────── */}
        {activeTab === "members" && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-2xl">
              <MemberEditor members={members} onChange={setMembers} />
            </div>
          </div>
        )}
      </div>

      {/* ── ツリータブ用スライドインパネル ─────────────── */}
      <>
        {treePanel.open && (
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            onClick={closeTreePanel} />
        )}
        <div className={
          "fixed inset-y-0 right-0 z-50 flex w-[400px] max-w-full flex-col border-l bg-card shadow-2xl transition-transform duration-300 " +
          (treePanel.open ? "translate-x-0" : "translate-x-full")
        }>
          <div className="flex h-14 shrink-0 items-center justify-between border-b px-5">
            <h2 className="text-sm font-semibold">
              {treePanel.contentType === "detail" ? "タスク詳細" :
               treePanel.task ? "タスクを編集" : "タスクを追加"}
            </h2>
            <button onClick={closeTreePanel}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {treePanel.contentType === "detail" && treePanel.task ? (
              <TaskDetailView
                task={treePanel.task}
                allTasks={tasks}
                onEdit={openTreeEdit}
                onClose={closeTreePanel}
                closeLabel="閉じる"
              />
            ) : (
              <TaskSidePanel
                open={treePanel.open}
                onClose={closeTreePanel}
                mode={treePanel.task ? "edit" : "create"}
                initialData={treeFormData}
                allTasks={tasks}
                reporters={reporters}
                onSubmit={handleTreeFormSubmit}
              />
            )}
          </div>
        </div>
      </>
    </div>
  );
}


// ── ProjectOverview ────────────────────────────────────────────────────────

function ProjectOverview({
  project, tasks, onUpdate,
}: {
  project:  { name: string; description?: string; status: import("@/types").TaskStatus };
  tasks:    Task[];
  onUpdate: (patch: { name?: string; description?: string; status?: import("@/types").TaskStatus }) => void;
}) {
  const [editName, setEditName]   = useState(false);
  const [editDesc, setEditDesc]   = useState(false);
  const [name,     setName]       = useState(project.name);
  const [desc,     setDesc]       = useState(project.description ?? "");

  // Keep local state in sync if project changes externally
  useEffect(() => { setName(project.name); },          [project.name]);
  useEffect(() => { setDesc(project.description ?? ""); }, [project.description]);

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== project.name) onUpdate({ name: trimmed });
    setEditName(false);
  };
  const saveDesc = () => {
    const trimmed = desc.trim();
    if (trimmed !== (project.description ?? "")) onUpdate({ description: trimmed || undefined });
    setEditDesc(false);
  };

  // Stats
  const flat  = useMemo(() => flattenTasks(tasks), [tasks]);
  const total = flat.length;
  const done  = flat.filter((t) => t.status === "done").length;
  const wip   = flat.filter((t) => t.status === "in_progress").length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  const STATUS_OPTIONS: { value: import("@/types").TaskStatus; label: string; color: string }[] = [
    { value: "pending",     label: "待機中",  color: "text-muted-foreground" },
    { value: "in_progress", label: "進行中",  color: "text-amber-600"        },
    { value: "done",        label: "完了",    color: "text-primary"           },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* ── Name ── */}
      <section className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">プロジェクト名</label>
        {editName ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setName(project.name); setEditName(false); } }}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-base font-semibold outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={saveName}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90">
              <Check size={15} />
            </button>
            <button onClick={() => { setName(project.name); setEditName(false); }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-accent">
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="group flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">{project.name}</h2>
            <button onClick={() => setEditName(true)}
              className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
              <Pencil size={13} />
            </button>
          </div>
        )}
      </section>

      {/* ── Description ── */}
      <section className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">説明</label>
        {editDesc ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="flex gap-2">
              <button onClick={saveDesc}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
                <Check size={12} /> 保存
              </button>
              <button onClick={() => { setDesc(project.description ?? ""); setEditDesc(false); }}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div className="group flex items-start gap-2">
            <p className={
              "flex-1 rounded-lg px-0 py-1 text-sm leading-relaxed " +
              (project.description ? "text-foreground" : "text-muted-foreground italic")
            }>
              {project.description ?? "説明を追加..."}
            </p>
            <button onClick={() => setEditDesc(true)}
              className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-all mt-0.5">
              <Pencil size={13} />
            </button>
          </div>
        )}
      </section>

      {/* ── Status ── */}
      <section className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">ステータス</label>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdate({ status: opt.value })}
              className={
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all " +
                (project.status === opt.value
                  ? "border-primary/60 bg-primary/10 " + opt.color
                  : "hover:bg-accent hover:border-primary/30 text-muted-foreground")
              }
            >
              {project.status === opt.value && <Check size={11} />}
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Statistics ── */}
      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-medium text-muted-foreground">タスク統計</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "合計",   value: total,        accent: "text-foreground"           },
            { label: "完了",   value: done,          accent: "text-primary"              },
            { label: "進行中", value: wip,           accent: "text-amber-600"            },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl border bg-card py-4">
              <span className={"text-2xl font-bold " + s.accent}>{s.value}</span>
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1.5 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>全体進捗</span>
            <span className="font-medium text-foreground">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-all duration-700"
              style={{ width: pct + "%" }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{done} / {total} タスク完了</p>
        </div>
      </section>
    </div>
  );
}
