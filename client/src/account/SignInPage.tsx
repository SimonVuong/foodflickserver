import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Typography } from '@material-ui/core';
import SignIn from 'general/components/lib/account/SignIn';
import { RouteComponentProps } from '@reach/router';
import { routes } from 'general/routes/routes';

const useStyles = makeStyles(theme => ({
  container: {
    paddingTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
}));

const SignInPage: React.FC<RouteComponentProps> = ({ navigate }) => {
  const classes = useStyles();
  return (
    <Container className={classes.container}>
      <Typography variant='h3'>Sign in</Typography>
      <SignIn
        onCreateAccountLink={() => navigate!(routes.signUp.getLink())}
        onSignIn={() => navigate!(routes.home.getLink())}
      />
    </Container>
  )
}

export default SignInPage;
