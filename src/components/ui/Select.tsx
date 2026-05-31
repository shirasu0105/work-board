import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { fieldBase } from "./Input";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "appearance-none pr-8", className)} {...props}>
      {children}
    </select>
  );
}
