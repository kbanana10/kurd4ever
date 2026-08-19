/**
 * cn.ts
 * 
 * Central CSS utility to safely merge Tailwind CSS classes dynamically using twMerge and clsx.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
