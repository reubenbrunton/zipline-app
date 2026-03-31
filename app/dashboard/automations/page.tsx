import { Plus, Play, Pause, Mail, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { automations } from "@/lib/mock-data";

const statusVariant: Record<string, any> = {
  Active: "success",
  Paused: "warning",
  Draft: "secondary",
};

export default function AutomationsPage() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Email Automations</h2>
          <p className="text-sm text-[#8888AA] mt-0.5">
            Build and manage automated email sequences
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Automation
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Flows", value: "3", icon: Zap, color: "text-[#FF4533]", bg: "bg-[#FF4533]/10" },
          { label: "Total Sends (Feb)", value: "251", icon: Mail, color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "Paused / Draft", value: "2", icon: Pause, color: "text-[#8888AA]", bg: "bg-white/[0.06]" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-white/[0.07] bg-[#1A1A2E] p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-[#8888AA]">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Automation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {automations.map((auto) => (
          <div
            key={auto.id}
            className="rounded-xl border border-white/[0.07] bg-[#1A1A2E] p-5 flex flex-col gap-4 hover:bg-[#22223A] transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#FF4533]/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-[#FF4533]" />
              </div>
              <Badge variant={statusVariant[auto.status]}>{auto.status}</Badge>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-1">
                {auto.name}
              </h3>
              <p className="text-xs text-[#8888AA]">
                Trigger: {auto.trigger}
              </p>
            </div>

            <div className="flex items-center gap-4 pt-1 border-t border-white/[0.05]">
              <div className="text-center">
                <p className="text-base font-bold text-white">{auto.sends}</p>
                <p className="text-[10px] text-[#8888AA]">Sends</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-white">{auto.steps}</p>
                <p className="text-[10px] text-[#8888AA]">Steps</p>
              </div>
              <div className="ml-auto">
                <p className="text-[11px] text-[#8888AA] text-right">
                  Last triggered
                </p>
                <p className="text-xs font-medium text-white/80 text-right">
                  {auto.lastTriggered}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 h-8">
                {auto.status === "Active" ? (
                  <>
                    <Pause className="h-3 w-3" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    Activate
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-8">
                Edit
              </Button>
            </div>
          </div>
        ))}

        {/* Empty CTA card */}
        <button className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] p-5 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-white/20 transition-colors min-h-[200px]">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
            <Plus className="h-5 w-5 text-[#8888AA]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white/60">New Automation</p>
            <p className="text-xs text-[#8888AA] mt-0.5">Build an email flow</p>
          </div>
        </button>
      </div>
    </div>
  );
}
