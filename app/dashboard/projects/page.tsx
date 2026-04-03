import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/lib/mock-data";

const statusVariant: Record<string, "default" | "success" | "warning" | "secondary" | "info"> = {
  "In Progress": "default",
  "Planning": "info",
  "In Review": "warning",
  "Complete": "success",
};

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Projects</h2>
          <p className="text-sm text-[#8888AA] mt-0.5">
            Manage and track all client projects
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8888AA] pointer-events-none" />
          <input
            placeholder="Search projects..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-white/[0.04] border border-white/[0.07] text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533]"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.07] bg-[#1A1A2E] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-5 py-3.5">
                Project
              </th>
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">
                Client
              </th>
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-4 py-3.5">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">
                Value
              </th>
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">
                Due Date
              </th>
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-4 py-3.5 hidden xl:table-cell">
                Progress
              </th>
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">
                Team
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, i) => (
              <tr
                key={project.id}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer last:border-0"
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-white">
                    {project.name}
                  </p>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <p className="text-sm text-[#8888AA]">{project.client}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={statusVariant[project.status] ?? "secondary"}>
                    {project.status}
                  </Badge>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <p className="text-sm font-semibold text-white">
                    {project.value}
                  </p>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <p className="text-sm text-[#8888AA]">{project.dueDate}</p>
                </td>
                <td className="px-4 py-4 hidden xl:table-cell">
                  <div className="flex items-center gap-2.5 min-w-[100px]">
                    <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FF4533]"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#8888AA] flex-shrink-0 w-8 text-right">
                      {project.progress}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <div className="flex -space-x-1.5">
                    {project.team.slice(0, 3).map((initials, j) => (
                      <div
                        key={j}
                        className="w-6 h-6 rounded-full bg-[#22223A] border border-[#1A1A2E] flex items-center justify-center text-[9px] font-bold text-white"
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
