import React from 'react';
import { cn } from '../../components/lib/utils';

const Card = ({ className, children }) => (
  <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
    {children}
  </div>
);

const CardHeader = ({ className, children }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)}>
    {children}
  </div>
);

const CardTitle = ({ className, children }) => (
  <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
    {children}
  </h3>
);

const CardDescription = ({ className, children }) => (
  <p className={cn('text-sm text-muted-foreground', className)}>
    {children}
  </p>
);

const CardContent = ({ className, children }) => (
  <div className={cn('p-6 pt-0', className)}>
    {children}
  </div>
);

const CardFooter = ({ className, children }) => (
    <div className={cn('flex items-center p-6 pt-0', className)}>
        {children}
    </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
