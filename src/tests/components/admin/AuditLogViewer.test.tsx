import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: vi.fn().mockImplementation(function (this: any, _cols: string, opts?: { head?: boolean }) {
        return opts?.head ? Promise.resolve({ count: 1, error: null }) : this;
      }),
      order: vi.fn().mockReturnThis(),
      // range() ends the logs query chain
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'log1',
            action: 'update_role',
            entity: 'profiles',
            entity_id: 'user-1',
            user_id: 'user-1',
            changes: { role: 'admin' },
            created_at: new Date().toISOString(),
            ip_address: null,
          },
        ],
        error: null,
      }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { name: 'Test User', email: 'test@example.com' },
      }),
    }),
  },
}));

describe('AuditLogViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders audit logs', async () => {
    render(<AuditLogViewer />);
    await waitFor(() => {
      expect(screen.getByText(/update role/i)).toBeInTheDocument();
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });
  });
});
