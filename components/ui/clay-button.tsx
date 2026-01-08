import { cn } from "@/lib/utils";
import React from "react";

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function ClayButton({ className, variant = "primary", children, ...props }: ClayButtonProps) {
  return (
    <button 
      className={cn(
        "clay-button",
        variant === "secondary" && "clay-button-secondary",
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
}
