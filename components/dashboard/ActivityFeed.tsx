import { activityFeed } from "@/lib/mock-data";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ActivityFeed() {
  return (
    <div className="rounded-xl  bg-white/[0.07] backdrop-blur-xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        <button className="text-xs text-[#FF4533] hover:text-[#ff6652] transition-colors">
          View all
        </button>
      </div>

      <ScrollArea className="flex-1 -mr-3 pr-3">
        <div className="flex flex-col gap-0">
          {activityFeed.map((item, i) => (
            <div key={item.id} className="flex gap-3 group">
              {/* Timeline */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: item.color }}
                >
                  {item.initials}
                </div>
                {i < activityFeed.length - 1 && (
                  <div className="w-px flex-1 bg-white/[0.05] my-1 min-h-[12px]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-3 min-w-0">
                <p className="text-xs text-white/80 leading-relaxed">
                  <span className="font-semibold text-white">{item.actor}</span>{" "}
                  {item.action}{" "}
                  <span className="text-[#FF4533]">{item.target}</span>
                </p>
                <p className="text-[11px] text-[#8888AA] mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
