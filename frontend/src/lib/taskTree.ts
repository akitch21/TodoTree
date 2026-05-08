import type { Task, TaskFormData } from "@/types";

let _seq = 0;
export function newTaskId(): string {
  return "task-" + Date.now() + "-" + ++_seq;
}

export function makeEmptyForm(override?: Partial<TaskFormData>): TaskFormData {
  return {
    text:              "",
    description:       "",
    dueDate:           "",
    parentId:          null,
    extraDependencies: [],
    // 起票者は呼び出し側で override する（authUser がメンバーならそれをデフォルトに）
    reporter:          null,
    assignee:          null,
    ...override,
  };
}

export function flattenTasks(tasks: Task[]): Task[] {
  return tasks.flatMap((t) => [t, ...flattenTasks(t.children)]);
}

export function addTaskToTree(tasks: Task[], newTask: Task): Task[] {
  if (newTask.parentId === null) return [...tasks, newTask];
  return tasks.map((t) =>
    t.id === newTask.parentId
      ? { ...t, children: [...t.children, newTask] }
      : { ...t, children: addTaskToTree(t.children, newTask) }
  );
}

export function updateTaskInTree(
  tasks: Task[],
  id: string,
  patch: Partial<Omit<Task, "children">>
): Task[] {
  return tasks.map((t) =>
    t.id === id
      ? { ...t, ...patch }
      : { ...t, children: updateTaskInTree(t.children, id, patch) }
  );
}

function removeAndExtract(
  tasks: Task[],
  id: string
): { tree: Task[]; removed: Task | null } {
  let removed: Task | null = null;

  // Check direct children first
  const tree = tasks.filter((t) => {
    if (t.id === id) { removed = t; return false; }
    return true;
  });

  if (removed) return { tree, removed };

  // Not a direct child — recurse into each subtree
  const treeWithUpdatedChildren = tree.map((t) => {
    const result = removeAndExtract(t.children, id);
    if (result.removed) {
      removed = result.removed;
      return { ...t, children: result.tree };
    }
    return t;
  });

  return { tree: treeWithUpdatedChildren, removed };
}

export function moveTaskInTree(tasks: Task[], taskId: string, newParentId: string | null): Task[] {
  const { tree, removed } = removeAndExtract(tasks, taskId);
  if (!removed) return tasks;
  return addTaskToTree(tree, { ...removed, parentId: newParentId });
}

export function deleteTaskFromTree(tasks: Task[], id: string): Task[] {
  return tasks
    .filter((t) => t.id !== id)
    .map((t) => ({ ...t, children: deleteTaskFromTree(t.children, id) }));
}

export function applyFormToTree(tasks: Task[], formData: TaskFormData, id?: string): Task[] {
  const patch: Partial<Omit<Task, "children">> = {
    text:               formData.text.trim(),
    description:        formData.description.trim() || undefined,
    dueDate:            formData.dueDate || undefined,
    reporter:           formData.reporter ?? undefined,
    assignee:           formData.assignee ?? undefined,
    extraDependencies:  formData.extraDependencies.length > 0
                          ? formData.extraDependencies
                          : undefined,
  };

  if (id) {
    const existing = flattenTasks(tasks).find((t) => t.id === id);
    if (!existing) return tasks;
    const updated = updateTaskInTree(tasks, id, patch);
    if (existing.parentId !== formData.parentId) {
      return moveTaskInTree(updated, id, formData.parentId);
    }
    return updated;
  }

  const newTask: Task = {
    id:                newTaskId(),
    text:              formData.text.trim(),
    description:       formData.description.trim() || undefined,
    status:            "pending",
    parentId:          formData.parentId,
    children:          [],
    createdAt:         new Date().toISOString(),
    dueDate:           formData.dueDate || undefined,
    reporter:          formData.reporter ?? undefined,
    assignee:          formData.assignee ?? undefined,
    extraDependencies: formData.extraDependencies.length > 0
                         ? formData.extraDependencies
                         : undefined,
  };
  return addTaskToTree(tasks, newTask);
}
