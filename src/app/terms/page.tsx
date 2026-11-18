import { Container, Typography } from '@mui/material';

export const metadata = { title: 'Terms – KonBase' };

export default function TermsPage() {
  return (
    <Container component='main' maxWidth='md' sx={{ py: 6 }}>
      <Typography variant='h4' component='h1' gutterBottom>
        Terms
      </Typography>
      <Typography color='text.secondary'>
        This is a demo deployment. No real data is collected or stored:
        everything you enter lives in memory and is discarded when the server
        restarts.
      </Typography>
    </Container>
  );
}
