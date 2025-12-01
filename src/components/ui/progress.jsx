import React from 'react';
import { cn } from '../../lib/utils';

const Progress = React.forwardRef(({ className, value, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
                className
            )}
            {...props}
        >
            <div
                className="flex-1 w-full h-full transition-all duration-300 bg-blue-500"
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
        </div>
    );
});

Progress.displayName = "Progress";

export { Progress };