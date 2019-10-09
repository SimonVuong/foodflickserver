import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { TextField, Button, Link } from '@material-ui/core';
import { connect } from 'react-redux';
import { RootActions, RootState } from 'general/redux/rootReducer';
import { ThunkDispatch } from 'redux-thunk';
import { signUpAction } from 'general/account/accountActions';

const useStyles = makeStyles(theme => ({
  button: {
    marginTop: theme.spacing(2),
  },
  haveAccount: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing(2),
  },
  link: {
    cursor: 'pointer',
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
}));

type props = {
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
  ) => Promise<boolean>,
  onSignInLink: () => void,
  onSignUp?: () => void,
}

const SignUp: React.FC<props> = ({ onSignUp, signUp, onSignInLink }) => {
  const classes = useStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const onClick = async () => {
    const signedIn = await signUp(email, password, firstName, lastName, phone);
    if (signedIn && onSignUp) onSignUp();
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
      <TextField
        fullWidth
        label='First name'
        value={firstName}
        onChange={e => setFirstName(e.target.value)}
        margin='normal'
      />
      <TextField
        fullWidth
        label='Last name'
        value={lastName}
        onChange={e => setLastName(e.target.value)}
        margin='normal'
      />
      <TextField
        fullWidth
        label='Phone to receive order updates'
        value={phone}
        onChange={e => setPhone(e.target.value)}
        margin='normal'
      />
      <Button
        onClick={onClick}
        variant='contained'
        fullWidth
        color='primary'
        className={classes.button}
      >
        Sign up
      </Button>
      <div className={classes.haveAccount}>
        <div>Have an account?&nbsp;</div>
        <Link onClick={onSignInLink} className={classes.link}>
          Sign in
        </Link>
      </div>
    </div>
  );
}

const mapDispatchToProps = (dispatch: ThunkDispatch<RootState, null, RootActions>) => ({
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
  ) => dispatch(signUpAction(
    email,
    password,
    firstName,
    lastName,
    phone
  ))
})

export default connect(null, mapDispatchToProps)(SignUp);
