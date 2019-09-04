import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Typography } from '@material-ui/core';
import SignUp from 'general/components/lib/account/SignUp';
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

const SignUpPage: React.FC<RouteComponentProps> = ({ navigate }) => {
  const classes = useStyles();
  return (
    <Container className={classes.container}>
      <Typography variant='h3'>Sign up</Typography>
      <SignUp
        onSignInLink={() => navigate!(routes.signIn.getLink())}
        onSignUp={() => navigate!(routes.home.getLink())}
      />
    </Container>
  )
}

export default SignUpPage;
