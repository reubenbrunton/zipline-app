import { myTasks } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  High: "bg-red-500/20 text-red-400",
  Medium: "bg-amber-500/20 text-amber-400",
  Low: "bg-emerald-500/20 text-emerald-400",
};

const stats = [
  { label: "My Tasks", value: 8, color: "#6366F1" },
  { label: "Due Today", value: 3, color: "#FF4533" },
  { label: "Overdue", value: 2, color: "#EF4444" },
];

export function TaskSummaryWidget() {
  return (
    <div className="rounded-xl  bg-white/[0.07] backdrop-blur-xl p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-white mb-4">Task Summary</h3>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-white/[0.03] p-3 text-center"
          >
            <p
              className="text-xl font-bold"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p className="text-[10px] text-[#8888AA] mt-0.5 leading-tight">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Mini task list */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
        {myTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-1 h-1 rounded-full bg-[#FF4533] flex-shrink-0" />
            <span className="text-xs text-white/80 flex-1 truncate group-hover:text-white transition-colors">
              {task.title}
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0",
                priorityColors[task.priority]
              )}
            >
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
