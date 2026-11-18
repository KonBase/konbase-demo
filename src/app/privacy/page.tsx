import { Container, Typography } from '@mui/material';

export const metadata = { title: 'Privacy – KonBase' };

export default function PrivacyPage() {
  return (
    <Container component='main' maxWidth='md' sx={{ py: 6 }}>
      <Typography variant='h4' component='h1' gutterBottom>
        Privacy
      </Typography>
      <Typography color='text.secondary'>
        This is a demo deployment. No real data is collected or stored:
        everything you enter lives in memory and is discarded when the server
        restarts.
      </Typography>
    </Container>
  );
}
