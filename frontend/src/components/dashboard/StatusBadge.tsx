import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/types";

interface StatusBadgeProps {
  status: TaskStatus;
}

const CONFIG: Record<TaskStatus, { label: string; variant: "success" | "secondary" | "muted" }> = {
  in_progress: { label: "In Progress", variant: "success" },
  pending:     { label: "Pending",     variant: "secondary" },
  done:        { label: "Done",        variant: "muted" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, variant } = CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
