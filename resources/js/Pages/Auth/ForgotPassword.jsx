import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography'; ``
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Head, router, usePage } from '@inertiajs/react';
import { Send } from '@mui/icons-material';
import { Alert, Snackbar } from '@mui/material';

function Copyright(props) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="#">
        I-Evaluate
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#960e21',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const ForgotPassword = ({ errors, flashMessage }) => {
  const { appName } = usePage().props;
  const [openFlashMessage, setOpenFlashMessage] = React.useState(true);
  const handleCloseFlashMessage = (_event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenFlashMessage(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const requestPayload = {
      email: data.get('email'),
    };
    router.post('/forgot-password', requestPayload);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Head title="Sign-in" />

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={3000}
        onClose={handleCloseFlashMessage}
        open={!!flashMessage && openFlashMessage}
      >
        <Alert
          onClose={handleCloseFlashMessage}
          severity={flashMessage?.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {flashMessage?.value}
        </Alert>
      </Snackbar>

      <Grid container component="main" sx={{ height: '100vh' }}>
        <CssBaseline />
        <Grid
          size={{ xs: 12, sm: 4, md: 7 }}
          sx={{
            backgroundImage: 'url(images/logo-kcp-emblem.png)',
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) =>
              t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
            backgroundSize: '33%',
            backgroundPosition: 'center',
          }}
        />
        <Grid size={{ xs: 12, sm: 8, md: 5 }} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              {appName}
            </Typography>
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                error={!!errors.email}
                helperText={!!errors.email && errors.email}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                endIcon={<Send />}
                sx={{ mt: 3, mb: 2 }}
              >
                Request Reset Link
              </Button>
              <Grid container>
                <Grid item xs>
                  <Link href="/login" variant="body2">
                    Back
                  </Link>
                </Grid>
              </Grid>
              <Copyright sx={{ mt: 5 }} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export default ForgotPassword;