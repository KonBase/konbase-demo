import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardOverviewSection from '@/components/dashboard/DashboardOverviewSection';
import React from 'react';

vi.mock('@/components/dashboard/AssociationOverviewCard', () => ({
  __esModule: true,
  default: () => <div>AssociationOverviewCardMock</div>,
}));
vi.mock('@/components/dashboard/RecentActivityCard', () => ({
  __esModule: true,
  default: () => <div>RecentActivityCardMock</div>,
}));
vi.mock('@/components/dashboard/QuickActionsCard', () => ({
  __esModule: true,
  default: () => <div>QuickActionsCardMock</div>,
}));
vi.mock('@/components/dashboard/components/ErrorBoundary', () => ({
  __esModule: true,
  default: (props: any) => <div>{props.children}</div>,
}));

describe('DashboardOverviewSection', () => {
  it('renders all cards', () => {
    render(
      <DashboardOverviewSection
        currentAssociation={{ id: 'a1', name: 'Test Association' } as any}
        isLoadingActivity={false}
        recentActivity={[]}
        activityError={null}
        handleRetry={() => {}}
      />
    );
    expect(screen.getByText(/AssociationOverviewCardMock/)).toBeInTheDocument();
    expect(screen.getByText(/RecentActivityCardMock/)).toBeInTheDocument();
    expect(screen.getByText(/QuickActionsCardMock/)).toBeInTheDocument();
  });
});
