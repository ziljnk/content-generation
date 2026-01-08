import { cn } from "@/lib/utils";
import React from "react";

type ClayCardProps = React.HTMLAttributes<HTMLDivElement>;

export function ClayCard({ className, children, ...props }: ClayCardProps) {
  return (
    <div className={cn("clay-card p-6", className)} {...props}>
      {children}
    </div>
  );
}
