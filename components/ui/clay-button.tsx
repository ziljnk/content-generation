import { cn } from "@/lib/utils";
import React from "react";

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function ClayButton({ className, variant = "primary", children, ...props }: ClayButtonProps) {
  return (
    <button 
      className={cn(
        "clay-button",
        variant === "secondary" && "clay-button-secondary",
        variant === "ghost" && "clay-button-ghost",
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
}
