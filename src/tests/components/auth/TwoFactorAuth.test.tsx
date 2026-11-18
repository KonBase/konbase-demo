import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TwoFactorAuth from '@/components/auth/TwoFactorAuth';
vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, profile: { id: 'u1', two_factor_enabled: false }, userProfile: { id: 'u1', role: 'admin' }, refreshProfile: vi.fn() }),
}));



describe('TwoFactorAuth', () => {
  it('renders status by default', () => {
    render(<TwoFactorAuth />);
    expect(screen.getAllByText(/Two-Factor Authentication/i).length).toBeGreaterThan(0);
  });
});
