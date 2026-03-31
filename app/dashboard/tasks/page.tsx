"use client";

import { motion } from "framer-motion";
import { ListKanbanBoard } from "@/components/tasks/ListKanbanBoard";

export default function TasksPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.44, ease: "easeOut" }}
      style={{ willChange: "opacity" }}
      className="h-full"
    >
      <ListKanbanBoard />
    </motion.div>
  );
}
