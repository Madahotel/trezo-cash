import React from "react";

// Classes par variante
const VARIANT_CLASSES = {
  default: `
    inline-flex items-center
    rounded-md border border-transparent
    px-2.5 py-0.5
    text-xs font-semibold
    transition-colors
    bg-primary text-primary-foreground shadow
    hover:bg-primary/80
    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
  `,
  secondary: `
    inline-flex items-center
    rounded-md border border-transparent
    px-2.5 py-0.5
    text-xs font-semibold
    transition-colors
    bg-secondary text-secondary-foreground
    hover:bg-secondary/80
    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
  `,
  destructive: `
    inline-flex items-center
    rounded-md border border-transparent
    px-2.5 py-0.5
    text-xs font-semibold
    transition-colors
    bg-destructive text-destructive-foreground shadow
    hover:bg-destructive/80
    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
  `,
  outline: `
    inline-flex items-center
    rounded-md border
    px-2.5 py-0.5
    text-xs font-semibold
    transition-colors
    text-foreground
    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
  `,
};

function Badge({ className = "", variant = "default", ...props }) {
  const classes = `${
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.default
  } ${className}`
    .split(/\s+/)
    .join(" ")
    .trim();

  return <div className={classes} {...props} />;
}

export { Badge };
