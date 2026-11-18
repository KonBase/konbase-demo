'use client';
import { Button, Container, Typography } from '@mui/material';

export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Container
      component='main'
      maxWidth='sm'
      sx={{ py: 8, textAlign: 'center' }}
      role='alert'
    >
      <Typography variant='h4' component='h1' gutterBottom>
        Something went wrong
      </Typography>
      <Button variant='contained' onClick={reset}>
        Try again
      </Button>
    </Container>
  );
}
