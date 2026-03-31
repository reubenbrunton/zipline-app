import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEvent } from "@/lib/calendar/calendarService";
import type { CalendarEvent } from "@/types/calendar";

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["events"] });
      const snapshots = queryClient.getQueriesData<CalendarEvent[]>({ queryKey: ["events"] });
      snapshots.forEach(([key, old]) => {
        if (!old) return;
        queryClient.setQueryData<CalendarEvent[]>(key, old.filter((e) => e.id !== id));
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
