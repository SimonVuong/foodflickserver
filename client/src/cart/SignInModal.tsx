import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Close from '@material-ui/icons/Close';
import { Grow, Typography, useMediaQuery, Theme } from '@material-ui/core';
import { useTheme } from '@material-ui/styles';
import SignIn from 'general/components/useCases/account/SignIn';
import SignUp from 'general/components/useCases/account/SignUp';

type props = {
  onClose: () => void,
  open: boolean,
  onSignUpSignIn: () => void,
}
const useStyles = makeStyles(theme => ({
  pointer: {
    cursor: 'pointer',
  },
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    paddingTop: theme.spacing(2),
    marginBottom: -theme.spacing(1),
  },
  paper: {
    height: '80%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2),
    overflowY: 'scroll',
  },
}));

const SignInModal: React.FC<props> = ({
  onClose,
  open,
  onSignUpSignIn,
}) => {
  const classes = useStyles();
  const theme: Theme = useTheme();
  const [screenToShow, setScreenToShow] = useState<'SignUp' | 'SignIn'>('SignUp');
  const isXSmall = useMediaQuery(theme.breakpoints.down('xs'));
  const paperStyle = {
    width: isXSmall ? '100%' : '80%',
  };
  return (
    <Modal className={classes.modal} open={open} onClose={onClose}>
      <Grow in={open}>
        <div className={classes.paper} style={paperStyle}>
          <Close onClick={onClose} className={classes.pointer} />
          {screenToShow === 'SignUp' && 
            <>
              <Typography variant='h5' className={classes.title}>Create an account to order</Typography>
              <SignUp onSignUp={onSignUpSignIn} onSignInLink={() => setScreenToShow('SignIn')}/>
            </>
          }
          {screenToShow === 'SignIn' && 
            <>
              <Typography variant='h5' className={classes.title}>Sign in to order</Typography>
              <SignIn onSignIn={onSignUpSignIn} onCreateAccountLink={() => setScreenToShow('SignUp')}/>
            </>
          }
        </div>
      </Grow>
    </Modal>
  );
}

export default SignInModal;
