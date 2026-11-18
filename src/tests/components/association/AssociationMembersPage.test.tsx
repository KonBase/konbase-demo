import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AssociationMembersPage from '@/components/association/AssociationMembersPage';
vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, profile: { id: 'u1', two_factor_enabled: false }, userProfile: { id: 'u1', role: 'admin' }, refreshProfile: vi.fn() }),
}));
vi.mock('@/contexts/AssociationContext', () => ({
  useAssociation: () => ({ currentAssociation: { id: 'a1', name: 'Test Association' } }),
}));


vi.mock('@/hooks/useAssociationMembers', () => ({
  useAssociationMembers: () => ({
    members: [
      {
        id: '1',
        user_id: 'u1',
        role: 'member',
        created_at: new Date().toISOString(),
        profile: { name: 'Alice', email: 'alice@example.com', profile_image: '' },
      },
    ],
    loading: false,
    fetchMembers: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
  }),
}));

describe('AssociationMembersPage', () => {
  it('renders members and invite dialog', () => {
    render(<AssociationMembersPage associationId="a1" />);
    expect(screen.getByText(/Association Members/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Invite Member/i)).toBeInTheDocument();
  });
});
