import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEvent } from "@/lib/calendar/calendarService";
import type { CalendarEvent } from "@/types/calendar";

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<CalendarEvent, "id" | "created_at">> }) =>
      updateEvent(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ["events"] });
      const snapshots = queryClient.getQueriesData<CalendarEvent[]>({ queryKey: ["events"] });
      snapshots.forEach(([key, old]) => {
        if (!old) return;
        queryClient.setQueryData<CalendarEvent[]>(key, old.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, snap]) => {
        queryClient.setQueryData(key, snap);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
