import * as React from 'react';
import { cn } from '@/lib/utils';
import type { MilestoneStatus } from '@/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'outline' | 'gold';

const variantClass: Record<BadgeVariant, string> = {
  default:   'bg-[#3730A3] text-white',
  gold:      'bg-[#FFFBEB] text-[#92400E] border border-[#F59E0B]/40',
  success:   'bg-[#F0FDF4] text-[#15803D] border border-[#16A34A]/25',
  warning:   'bg-[#FFFBEB] text-[#B45309] border border-[#D97706]/25',
  danger:    'bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/25',
  info:      'bg-[#EEF2FF] text-[#3730A3] border border-[#3730A3]/20',
  secondary: 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]',
  outline:   'border border-[#3730A3]/20 text-[#3730A3]',
};

const MILESTONE_VARIANT: Record<MilestoneStatus, BadgeVariant> = {
  NOT_STARTED: 'secondary',
  IN_PROGRESS: 'info',
  SUBMITTED:   'warning',
  APPROVED:    'success',
  FLAGGED:     'danger',
};

export function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  const labels: Record<MilestoneStatus, string> = {
    NOT_STARTED: 'Not started',
    IN_PROGRESS: 'In progress',
    SUBMITTED:   'Submitted',
    APPROVED:    'Approved',
    FLAGGED:     'Flagged',
  };
  return <Badge variant={MILESTONE_VARIANT[status]}>{labels[status]}</Badge>;
}

export function Badge({
  variant = 'default', className, children, ...props
}: { variant?: BadgeVariant; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        variantClass[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
