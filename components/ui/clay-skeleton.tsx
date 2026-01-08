import { cn } from "@/lib/utils";

interface ClaySkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    width?: string | number;
    height?: string | number;
}

export function ClaySkeleton({ className, width, height, ...props }: ClaySkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-gray-200/50",
        "shadow-[inset_2px_2px_5px_rgba(163,177,198,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]",
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

export function ContentSkeleton() {
    return (
        <div className="space-y-6 w-full animate-in fade-in duration-500">
            {/* Hero Image Skeleton */}
            <ClaySkeleton className="w-full aspect-video rounded-3xl" />
            
            {/* Title Skeleton */}
            <div className="space-y-3">
                <ClaySkeleton className="h-10 w-3/4" />
                <ClaySkeleton className="h-4 w-1/2" />
            </div>

            {/* Content Body Skeleton */}
            <div className="space-y-4">
                <ClaySkeleton className="h-4 w-full" />
                <ClaySkeleton className="h-4 w-full" />
                <ClaySkeleton className="h-4 w-5/6" />
                <ClaySkeleton className="h-4 w-full" />
            </div>
            
            <div className="space-y-4 pt-4">
                <ClaySkeleton className="h-8 w-1/3" />
                <ClaySkeleton className="h-4 w-full" />
                <ClaySkeleton className="h-4 w-5/6" />
            </div>
        </div>
    )
}
