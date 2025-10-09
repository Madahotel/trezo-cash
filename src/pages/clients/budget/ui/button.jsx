import React from "react";

// Définition des styles selon les variantes
const VARIANT_CLASSES = {
  default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
  destructive:
    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
  outline:
    "border border-input shadow-sm hover:bg-accent hover:text-accent-foreground",
  secondary:
    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

// Définition des tailles
const SIZE_CLASSES = {
  default:
    "h-9 px-4 py-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  sm: "h-8 rounded-md px-3 text-xs inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  lg: "h-10 rounded-md px-8 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  icon: "h-9 w-9 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
};

const Button = React.forwardRef(
  (
    { className = "", variant = "default", size = "default", ...props },
    ref
  ) => {
    // Concaténation simple des classes
    const classes = `${VARIANT_CLASSES[variant] || ""} ${
      SIZE_CLASSES[size] || ""
    } ${className}`.trim();

    return <button ref={ref} className={classes} {...props} />;
  }
);

Button.displayName = "Button";

export { Button };
