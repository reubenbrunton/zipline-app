import { pipeline } from "@/lib/mock-data";
import { ChevronRight } from "lucide-react";

const stageColors = ["#8888AA", "#6366F1", "#FF4533", "#10B981"];

export function CRMPipelineSnapshot() {
  return (
    <div className="rounded-xl  bg-white/[0.07] backdrop-blur-xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">CRM Pipeline</h3>
        <ChevronRight className="h-4 w-4 text-[#8888AA]" />
      </div>

      {/* Pipeline flow bar */}
      <div className="flex rounded-full overflow-hidden h-1.5 mb-4 gap-0.5">
        {pipeline.map((stage, i) => (
          <div
            key={stage.stage}
            className="h-full rounded-full"
            style={{
              backgroundColor: stageColors[i],
              flex: stage.count,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2.5 flex-1">
        {pipeline.map((stage, i) => (
          <div
            key={stage.stage}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: stageColors[i] }}
            />
            <span className="text-xs font-medium text-white/80 flex-1">
              {stage.stage}
            </span>
            <span className="text-xs text-[#8888AA]">{stage.count} deals</span>
            <span className="text-xs font-semibold text-white">
              {stage.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
