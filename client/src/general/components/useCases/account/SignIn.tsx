import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { TextField, Button, Link } from '@material-ui/core';
import { connect } from 'react-redux';
import { RootActions, RootState } from 'general/redux/rootReducer';
import { ThunkDispatch } from 'redux-thunk';
import { signInWithBasicAction } from 'general/account/accountActions';
import AnalyticsService from '../../../../analytics/analyticsService';
import events from '../../../../analytics/events';

const useStyles = makeStyles(theme => ({
  signIn: {
    marginTop: theme.spacing(2),
  },
  createAccount: {
    marginTop: theme.spacing(2),
    textAlign: 'center',
    cursor: 'pointer',
  },
  paper: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
}));

type props = {
  onSignIn?: () => void
  signIn: (email: string, password: string) => Promise<boolean>,
  onCreateAccountLink: () => void
}

const SignIn: React.FC<props> = ({ onSignIn, signIn, onCreateAccountLink }) => {
  const classes = useStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const onClick = async () => {
    const signedIn = await signIn(email, password);
    if (signedIn && onSignIn) onSignIn();
  }
  return (
    <div className={classes.paper}>
      <TextField
        fullWidth
        label='Email'
        value={email}
        onChange={e => setEmail(e.target.value)}
        margin="normal"
      />
      <TextField
        fullWidth
        label='Password'
        type='password'
        value={password}
        onChange={e => setPassword(e.target.value)}
        margin='normal'
      />
      <Button
        onClick={() => { onClick(); AnalyticsService.trackEvent(events.SIGN_IN) }}
        variant='contained'
        fullWidth
        color='primary'
        className={classes.signIn}
      >
        Sign in
      </Button>
      <Link
        onClick={onCreateAccountLink}
        className={classes.createAccount}
      >
        Create account
      </Link>
    </div>
  );
}

const mapDispatchToProps = (dispatch: ThunkDispatch<RootState, null, RootActions>) => ({
  signIn: (email: string, password: string): Promise<boolean> => dispatch(signInWithBasicAction(email, password))
})

export default connect(null, mapDispatchToProps)(SignIn);
