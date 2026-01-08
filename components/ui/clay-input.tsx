import { cn } from "@/lib/utils";
import React from "react";

interface ClayInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const ClayInput = React.forwardRef<HTMLInputElement, ClayInputProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold ml-1 text-gray-600">
            {label}
          </label>
        )}
        <input 
            id={id}
            ref={ref}
            className={cn("clay-input", className)} 
            {...props} 
        />
      </div>
    );
  }
);
ClayInput.displayName = "ClayInput";
