import { Badge, type BadgeProps } from "@/components/ui";

export interface Update {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "feature" | "fix" | "update" | "announcement";
}

export interface UpdatesCardProps {
  updates: Update[];
}

const typeStyle: Record<Update["type"], { label: string; variant: BadgeProps["variant"] }> = {
  feature: { label: "New", variant: "primary" },
  fix: { label: "Fix", variant: "pink" },
  update: { label: "Update", variant: "secondary" },
  announcement: { label: "News", variant: "warning" },
};

export function UpdatesCard({ updates }: UpdatesCardProps) {
  return (
    <ol className="pixel-panel divide-y-2 divide-dashed divide-cyber-border">
      {updates.map((update) => {
        const style = typeStyle[update.type];
        return (
          <li key={update.id} className="space-y-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <Badge variant={style.variant} size="sm">
                {style.label}
              </Badge>
              <time dateTime={update.date} className="font-ui text-xs text-cyber-text-muted">
                {update.date}
              </time>
            </div>
            <h3 className="text-cyber-text-primary" style={{ fontSize: "1.05rem" }}>
              {update.title}
            </h3>
            <p className="text-sm leading-relaxed text-cyber-text-secondary">{update.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
