import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomeHeader from '@/components/layout/HomeHeader'; // Adjust path
import React from 'react';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  Link: (props: any) => <a href={props.to}>{props.children}</a>,
  useNavigate: () => mockNavigate,
}));
vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({
    user: null, // Default: logged out
    userProfile: null,
  }),
}));
vi.mock('@/components/theme/ThemeToggle', () => ({ // Adjust path
  ThemeToggle: () => <button>ThemeToggle</button>,
}));
vi.mock('@/components/layout/shared/UserMenu', () => ({ // Adjust path
  default: () => <div data-testid="user-menu">UserMenu</div>,
}));
vi.mock('@/components/ui/sheet', () => ({ // Adjust path
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/navigation-menu', () => ({ // Adjust path
  NavigationMenu: ({ children }: { children: React.ReactNode }) => <nav>{children}</nav>,
  NavigationMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavigationMenuItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  NavigationMenuList: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  NavigationMenuTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));
vi.mock('@/contexts/auth/AuthUtils', () => ({
  checkUserHasRole: () => false, // Default mock
}));

describe('HomeHeader', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Reset mocks
    vi.doMock('@/contexts/auth', () => ({
      useAuth: () => ({ user: null, userProfile: null }),
    }));
    vi.doMock('@/contexts/auth/AuthUtils', () => ({
      checkUserHasRole: () => false,
    }));
  });

  it('renders logo and title', async () => {
    render(<HomeHeader />);
    expect(screen.getByAltText('KonBase Logo')).toBeInTheDocument();
    expect(screen.getByText('KonBase')).toBeInTheDocument();
  });

  it('renders Login and Register buttons when logged out', async () => {
    render(<HomeHeader />);
    expect(screen.getAllByText('Login')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Register')[0]).toBeInTheDocument();
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
  });

  it('renders Dashboard button and UserMenu when logged in', async () => {
    vi.doMock('@/contexts/auth', () => ({
      useAuth: () => ({ user: { id: 'u1', email: 'test@test.com', user_metadata: { name: 'Tester' } }, userProfile: { role: 'member' } }),
    }));
    vi.resetModules();
    const HomeHeaderReloaded = (await import('@/components/layout/HomeHeader')).default;
    render(<HomeHeaderReloaded />);
    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  it('navigates to /login when Login clicked', async () => {
    render(<HomeHeader />);
    fireEvent.click(screen.getAllByText('Login')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to /register when Register clicked', async () => {
    render(<HomeHeader />);
    fireEvent.click(screen.getAllByText('Register')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('opens mobile menu when hamburger clicked', async () => {
    render(<HomeHeader />);
    // Find the hamburger button (might need a more specific selector)
    const hamburgerButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburgerButton);
    // Check if the sheet content is rendered (assuming SheetContent mock works)
    expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
    // Check for an item within the mobile menu
    expect(screen.getAllByText('Features')[0]).toBeInTheDocument();
  });
});
