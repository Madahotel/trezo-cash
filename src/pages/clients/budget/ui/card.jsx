import React from "react";

const Card = React.forwardRef(({ className = "", ...props }, ref) => {
  const classes =
    `rounded-xl border bg-card text-card-foreground shadow ${className}`.trim();
  return <div ref={ref} className={classes} {...props} />;
});
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className = "", ...props }, ref) => {
  const classes = `flex flex-col space-y-1.5 p-6 ${className}`.trim();
  return <div ref={ref} className={classes} {...props} />;
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className = "", ...props }, ref) => {
  const classes =
    `font-semibold leading-none tracking-tight ${className}`.trim();
  return <div ref={ref} className={classes} {...props} />;
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(
  ({ className = "", ...props }, ref) => {
    const classes = `text-sm text-muted-foreground ${className}`.trim();
    return <div ref={ref} className={classes} {...props} />;
  }
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className = "", ...props }, ref) => {
  const classes = `p-6 pt-0 ${className}`.trim();
  return <div ref={ref} className={classes} {...props} />;
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className = "", ...props }, ref) => {
  const classes = `flex items-center p-6 pt-0 ${className}`.trim();
  return <div ref={ref} className={classes} {...props} />;
});
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
