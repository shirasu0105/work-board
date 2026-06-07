"use client";
import { useParams } from "next/navigation";
import { useStore } from "@/components/store";
import { TasksScreen } from "@/components/screens/tasks";

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const s = useStore();
  const cat = s.categories.find((c) => c.id === id);
  return <TasksScreen key={id} fixedCat={id} title={cat ? cat.name : "カテゴリ"} />;
}
