import {
  DollarSign,
  FolderKanban,
  CheckSquare,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { kpiData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  DollarSign,
  FolderKanban,
  CheckSquare,
  Users,
};

export function KPICards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi, i) => {
        const Icon = iconMap[kpi.icon];
        return (
          <div
            key={i}
            className="rounded-xl  bg-white/[0.07] backdrop-blur-xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8888AA] uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FF4533]/10 flex items-center justify-center">
                {Icon && <Icon className="h-4 w-4 text-[#FF4533]" />}
              </div>
            </div>
            <div className="flex items-end justify-between gap-2">
              <span className="text-2xl font-bold text-white leading-none">
                {kpi.value}
              </span>
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full",
                  kpi.positive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                )}
              >
                {kpi.positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {kpi.delta}
              </span>
            </div>
            <p className="text-xs text-[#8888AA]">{kpi.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
