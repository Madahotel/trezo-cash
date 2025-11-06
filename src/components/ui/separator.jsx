import * as React from 'react';

const Separator = React.forwardRef(
  (
    { className = '', orientation = 'horizontal', decorative = true, ...props },
    ref
  ) => {
    const baseClasses = 'shrink-0 bg-border';
    const orientationClass =
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]';

    const combinedClassName =
      `${baseClasses} ${orientationClass} ${className}`.trim();

    return (
      <div
        ref={ref}
        className={combinedClassName}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={!decorative ? orientation : undefined}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';

export { Separator };
