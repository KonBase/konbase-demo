'use client';
import { ReactNode, useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Box,
  Container,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
// Replace icons with simple text to avoid extra dependency for now
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
// useEffect/useState already imported
import { useAppStore } from '@/lib/utils/store';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ChatWidget } from '@/components/chat/ChatWidget';

export default function AppLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Inventory', href: '/inventory' },
    { label: 'Equipment Sets', href: '/inventory/equipment-sets' },
    { label: 'Conventions', href: '/conventions' },
    { label: 'Reports', href: '/reports' },
    { label: 'Associations', href: '/associations' },
    { label: 'Admin Panel', href: '/admin', adminOnly: true },
  ];

  const assoc = useAppStore(s => s.currentAssociation);
  const setAssoc = useAppStore(s => s.setAssociation);
  const [associations, setAssociations] = useState<
    Array<{ id: string; name: string }>
  >([]);
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/associations');
      if (res.ok) {
        const j = await res.json();
        const list = (j.data || []).map((m: Record<string, unknown>) => ({
          id: (m.association as { id: string }).id,
          name: (m.association as { name: string }).name,
        }));
        setAssociations(list);
        if (!assoc && list[0]) setAssoc(list[0]);
      }
    })();
  }, [assoc, setAssoc]);

  return (
    <Box>
      <Box
        component='a'
        href='#main-content'
        sx={{
          position: 'absolute',
          left: 8,
          top: -48,
          zIndex: 2000,
          bgcolor: 'background.paper',
          color: 'text.primary',
          px: 2,
          py: 1,
          borderRadius: 1,
          '&:focus': { top: 8 },
        }}
      >
        Skip to main content
      </Box>
      <AppBar position='sticky' component='header'>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            color='inherit'
            onClick={() => setOpen(true)}
            aria-label='Open navigation menu'
            aria-haspopup='dialog'
            edge='start'
          >
            <span aria-hidden='true'>☰</span>
          </IconButton>
          <Typography
            variant='h6'
            component='div'
            sx={{ flexGrow: { xs: 0, sm: 1 }, mr: { xs: 0, sm: 2 } }}
          >
            KonBase
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'block', sm: 'none' } }} />
          <Autocomplete
            size='small'
            sx={{
              minWidth: { xs: 120, sm: 220 },
              flexShrink: 1,
              mr: { sm: 2 },
            }}
            options={associations}
            value={assoc || null}
            getOptionLabel={o => o?.name || ''}
            onChange={(_, v) => setAssoc(v || undefined)}
            renderInput={params => (
              <TextField {...params} label='Association' />
            )}
            // Readable on the primary-colored AppBar (default field colors assume a light surface)
            slotProps={{ paper: { sx: { color: 'text.primary' } } }}
          />

          <TextField
            size='small'
            placeholder='Search...'
            inputProps={{ 'aria-label': 'Search' }}
            sx={{
              '& .MuiInputBase-input, & .MuiInputBase-input::placeholder': {
                color: '#fff',
                opacity: 1,
              },
              bgcolor: 'rgba(255,255,255,0.15)',
              borderRadius: 1,
              mr: 2,
              minWidth: 240,
              display: { xs: 'none', md: 'inline-flex' },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start' aria-hidden='true'>
                  🔎
                </InputAdornment>
              ),
            }}
            onChange={e => useAppStore.getState().setSearch(e.target.value)}
          />
          <Typography sx={{ mr: 2, display: { xs: 'none', lg: 'block' } }}>
            {(
              session as {
                user?: { profile?: { display_name?: string }; email?: string };
              }
            )?.user?.profile?.display_name ??
              (session as { user?: { email?: string } })?.user?.email}
          </Typography>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Chat Widget */}
          <ChatWidget />

          <IconButton
            color='inherit'
            onClick={e => setAnchorEl(e.currentTarget)}
            aria-label='Account menu'
            aria-haspopup='menu'
            aria-expanded={!!anchorEl}
          >
            <Avatar
              src={
                (session as { user?: { profile?: { avatar_url?: string } } })
                  ?.user?.profile?.avatar_url || undefined
              }
            />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => router.push('/users/profile')}>
              Profile
            </MenuItem>
            <MenuItem onClick={() => router.push('/associations')}>
              Switch Association
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer anchor='left' open={open} onClose={() => setOpen(false)}>
        <Box
          component='nav'
          aria-label='Main navigation'
          sx={{ width: 260 }}
          onClick={() => setOpen(false)}
        >
          <List>
            {menuItems.map(item => {
              // Check if item is admin-only and user is not super admin
              if (
                item.adminOnly &&
                (session as { user?: { role?: string } })?.user?.role !==
                  'super_admin'
              ) {
                return null;
              }
              return (
                <ListItemButton
                  key={item.href}
                  component={Link}
                  href={item.href}
                  selected={
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href)
                  }
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>

      <Container
        component='main'
        id='main-content'
        tabIndex={-1}
        maxWidth='lg'
        sx={{ py: 3, outline: 'none' }}
      >
        {children}
        <Box
          component='footer'
          sx={{ mt: 6, py: 2, color: 'text.secondary', textAlign: 'center' }}
        >
          <Divider sx={{ mb: 2 }} />
          <Typography variant='body2'>
            © {new Date().getFullYear()} KonBase
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
