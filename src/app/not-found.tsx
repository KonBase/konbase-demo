import { Button, Container, Typography } from '@mui/material';

export default function NotFound() {
  return (
    <Container
      component='main'
      maxWidth='sm'
      sx={{ py: 8, textAlign: 'center' }}
    >
      <Typography variant='h4' component='h1' gutterBottom>
        Page not found
      </Typography>
      <Typography color='text.secondary' sx={{ mb: 3 }}>
        The page you are looking for does not exist or was moved.
      </Typography>
      <Button variant='contained' href='/dashboard'>
        Back to dashboard
      </Button>
    </Container>
  );
}
