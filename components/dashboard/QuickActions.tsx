import { FolderPlus, UserPlus, FileText, Send } from "lucide-react";

const actions = [
  {
    label: "New Project",
    icon: FolderPlus,
    color: "#6366F1",
    bg: "bg-indigo-500/10",
  },
  {
    label: "Add Contact",
    icon: UserPlus,
    color: "#10B981",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Create Invoice",
    icon: FileText,
    color: "#F59E0B",
    bg: "bg-amber-500/10",
  },
  {
    label: "Send Campaign",
    icon: Send,
    color: "#FF4533",
    bg: "bg-[#FF4533]/10",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl  bg-white/[0.07] backdrop-blur-xl p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-2.5 flex-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.04] hover:border-white/[0.1] transition-all group"
            >
              <div
                className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <Icon className="h-4 w-4" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
