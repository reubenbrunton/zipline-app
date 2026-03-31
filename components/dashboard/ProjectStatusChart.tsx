"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { projectStatusData } from "@/lib/mock-data";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#22223A] border border-white/10 rounded-lg px-3 py-2 text-sm">
        <p className="text-white font-semibold">{payload[0].name}</p>
        <p className="text-[#8888AA] text-xs">{payload[0].value} projects</p>
      </div>
    );
  }
  return null;
};

export function ProjectStatusChart() {
  const total = projectStatusData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl  bg-white/[0.07] backdrop-blur-xl p-5 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Project Status</h3>
        <p className="text-xs text-[#8888AA] mt-0.5">{total} total projects</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={55}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <span className="text-xl font-bold text-white">{total}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          {projectStatusData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-[#8888AA] flex-1">{item.name}</span>
              <span className="text-xs font-semibold text-white">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
