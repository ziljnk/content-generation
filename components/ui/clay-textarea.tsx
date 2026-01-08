import { cn } from "@/lib/utils";
import React from "react";

interface ClayTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const ClayTextarea = React.forwardRef<HTMLTextAreaElement, ClayTextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold ml-1 text-gray-600">
            {label}
          </label>
        )}
        <textarea 
            id={id}
            ref={ref}
            className={cn("clay-input min-h-[120px] resize-y", className)} 
            {...props} 
        />
      </div>
    );
  }
);
ClayTextarea.displayName = "ClayTextarea";
