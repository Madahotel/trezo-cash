import React from "react";

const Label = React.forwardRef(({ className = "", ...props }, ref) => {
  const classes = `
    text-sm font-medium leading-none
    peer-disabled:cursor-not-allowed peer-disabled:opacity-70
    ${className}
  `
    .split(/\s+/)
    .join(" ")
    .trim();

  return <label ref={ref} className={classes} {...props} />;
});

Label.displayName = "Label";

export { Label };
