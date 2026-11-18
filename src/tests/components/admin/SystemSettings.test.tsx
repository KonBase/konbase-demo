import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SystemSettings } from '@/components/admin/SystemSettings';

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { id: 'admin', role: 'super_admin' },
  }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({}),
    }),
  },
}));
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

describe('SystemSettings', () => {
  it('renders tabs and settings', () => {
    render(<SystemSettings />);
    expect(screen.getByText(/General Settings/i)).toBeInTheDocument(); // default tab content
    for (const name of ['General', 'Security', 'Email', 'Backup']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument();
    }
  });
});
