import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label:     string;
  value:     string | number;
  progress?: number;
  icon?:     React.ReactNode;
  variant?:  "default" | "danger";
}

export function StatCard({ label, value, progress, icon, variant = "default" }: StatCardProps) {
  return (
    <Card className={cn(
      "transition-colors",
      variant === "danger" && "border-destructive/40 bg-destructive/5"
    )}>
      <CardHeader className="pb-1 flex flex-row items-center justify-between gap-2">
        <CardTitle className={cn(
          "text-sm font-medium",
          variant === "danger" ? "text-destructive" : "text-muted-foreground"
        )}>
          {label}
        </CardTitle>
        {icon && <span className="shrink-0">{icon}</span>}
      </CardHeader>
      <CardContent>
        <p className={cn(
          "text-3xl font-bold",
          variant === "danger" && "text-destructive"
        )}>
          {value}
        </p>
        {progress !== undefined && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
