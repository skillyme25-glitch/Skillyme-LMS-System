import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-white rounded-lg border border-[#3730A3]/08 shadow-sm transition-shadow duration-200', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4 border-b border-[#3730A3]/08', className)} {...props}>{children}</div>;
}

export function CardBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4', className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4 border-t border-[#3730A3]/08 bg-[#F8F7FF] rounded-b-lg', className)} {...props}>{children}</div>;
}

export function StatCard({
  label, value, icon, colorClass = 'bg-[#EEF2FF] text-[#3730A3]',
}: {
  label: string; value: number | string; icon: React.ReactNode; colorClass?: string;
}) {
  return (
    <Card className="stat-card">
      <CardBody className="flex items-center gap-4">
        <div className={cn('p-3 rounded-lg', colorClass)}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-[#111827]">{value}</p>
          <p className="text-xs text-[#6B7280] uppercase tracking-wider">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}
