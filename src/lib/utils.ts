// src/lib/utils.ts
import type { ClassValue } from "clsx";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn components expect `cn` to live here
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
