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
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Head, router, usePage } from '@inertiajs/react';
import { Send, Token } from '@mui/icons-material';

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

const defaultTheme = createTheme();

const ResetPassword = ({ errors, email, token }) => {
  const { appName } = usePage().props;

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const requestPayload = {
      email: data.get('email'),
      password: data.get('password'),
      password_confirmation: data.get('password_confirmation'),
      token: data.get('token'),
    };
    router.post('/reset-password', requestPayload);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Head title="Sign-in" />
      <Grid container component="main" sx={{ height: '100vh' }}>
        <CssBaseline />
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage: 'url(images/logo-kcp-emblem.png)',
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) =>
              t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
            backgroundSize: 'contain',
            backgroundPosition: 'center',
          }}
        />
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
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
                defaultValue={email}
                inputProps={{ readOnly: true }}
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                error={!!errors.email}
                helperText={!!errors.email && errors.email}
              />
              <TextField
                autoFocus
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                error={!!errors.password}
                helperText={!!errors.password && errors.password}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password_confirmation"
                label="Confirm Password"
                type="password"
                id="password_confirmation"
                autoComplete="current-password"
              />
              <input type="hidden" name="token" value={token} />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                endIcon={<Send />}
                sx={{ mt: 3, mb: 2 }}
              >
                Change Password
              </Button>
              <Copyright sx={{ mt: 5 }} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export default ResetPassword;