import { cn } from "@/lib/utils";

interface Feature {
  readonly name: string;
  readonly info: string;
  readonly free: boolean | string;
  readonly pro: boolean | string;
}

interface FeatureCategory {
  readonly category: string;
  readonly features: readonly Feature[];
}

export interface FeatureComparisonProps {
  features: readonly FeatureCategory[];
  freeLabel?: string;
  proLabel?: string;
  className?: string;
}

function Value({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="font-ui text-sm text-cyber-text-primary">{value}</span>;
  }
  return (
    <span
      className={cn(
        "mx-auto grid h-6 w-6 place-items-center border-2 border-cyber-ink font-ui text-xs",
        value ? "bg-cyber-primary text-cyber-ink" : "bg-cyber-dark-tertiary text-cyber-text-muted"
      )}
      aria-label={value ? "Included" : "Not included"}
    >
      {value ? "✓" : "–"}
    </span>
  );
}

export function FeatureComparison({ features, freeLabel = "Explorer", proLabel = "Elite", className }: FeatureComparisonProps) {
  return (
    <div className={cn("pixel-panel overflow-x-auto", className)}>
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <thead>
          <tr className="border-b-[3px] border-cyber-ink bg-cyber-ink">
            <th scope="col" className="px-5 py-4 font-ui text-cyber-text-muted">
              Feature
            </th>
            <th scope="col" className="w-36 px-4 py-4 text-center font-ui text-cyber-text-primary">
              {freeLabel}
            </th>
            <th scope="col" className="w-36 px-4 py-4 text-center font-ui text-cyber-warning">
              {proLabel}
            </th>
          </tr>
        </thead>
        {features.map((category) => (
          <tbody key={category.category}>
            <tr>
              <th colSpan={3} scope="colgroup" className="bg-cyber-dark-tertiary px-5 py-2 pixel-label text-cyber-secondary">
                {category.category}
              </th>
            </tr>
            {category.features.map((feature) => (
              <tr key={feature.name} className="border-t-2 border-dashed border-cyber-border">
                <th scope="row" className="px-5 py-3 font-normal">
                  <span className="block text-cyber-text-primary">{feature.name}</span>
                  <span className="block text-sm text-cyber-text-muted">{feature.info}</span>
                </th>
                <td className="px-4 py-3 text-center">
                  <Value value={feature.free} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Value value={feature.pro} />
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
