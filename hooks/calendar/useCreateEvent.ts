import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent } from "@/lib/calendar/calendarService";
import type { CalendarEvent } from "@/types/calendar";

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CalendarEvent, "id" | "created_at">) => createEvent(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["events"] });
      const snapshots = queryClient.getQueriesData<CalendarEvent[]>({ queryKey: ["events"] });
      const optimistic: CalendarEvent = {
        ...data,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      snapshots.forEach(([key]) => {
        queryClient.setQueryData<CalendarEvent[]>(key, (old) => [...(old ?? []), optimistic]);
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
