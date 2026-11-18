'use client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Typography,
} from '@mui/material';
import AppLayout from '@/components/layout/AppLayout';

type Field = [label: string, value: unknown];

// Read-only detail view: finds one record in an existing list endpoint (no per-id API yet).
export default function DetailPage<T extends { id: string }>({
  id,
  url,
  pick,
  backHref,
  backLabel,
  title,
  fields,
}: {
  id: string;
  url: string;
  pick?: (json: unknown) => T[];
  backHref: string;
  backLabel: string;
  title: (r: T) => string;
  fields: (r: T) => Field[];
}) {
  const { data: session } = useSession();
  const associationId =
    (session?.user as { associations?: { association: { id: string } }[] })
      ?.associations?.[0]?.association.id || '';
  const { data, isLoading } = useQuery({
    queryKey: ['detail', url, id],
    enabled: !!session,
    queryFn: async () => {
      const res = await fetch(url, {
        headers: { 'x-association-id': associationId },
      });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      const list = (pick ? pick(json) : json.data) as T[];
      return list.find(r => r.id === id) ?? null;
    },
  });

  return (
    <AppLayout>
      <Button href={backHref} sx={{ mb: 2 }}>
        ← {backLabel}
      </Button>
      {isLoading ? (
        <Skeleton variant='rounded' height={200} aria-label='Loading' />
      ) : !data ? (
        <Alert severity='warning'>
          Not found, or you do not have access to it.
        </Alert>
      ) : (
        <Card>
          <CardContent>
            <Typography variant='h4' component='h1' gutterBottom>
              {title(data)}
            </Typography>
            <Box
              component='dl'
              sx={{
                m: 0,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '200px 1fr' },
                gap: 1,
              }}
            >
              {fields(data).map(([label, value]) => (
                <Box key={label} sx={{ display: 'contents' }}>
                  <Typography component='dt' color='text.secondary'>
                    {label}
                  </Typography>
                  <Typography component='dd' sx={{ m: 0 }}>
                    {value === null || value === undefined || value === ''
                      ? '—'
                      : String(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
