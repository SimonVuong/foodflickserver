import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Typography } from '@material-ui/core';
import { RouteComponentProps } from '@reach/router';
import { connect } from 'react-redux';
import { RootState } from 'general/redux/rootReducer';
import { SignedInUser } from 'general/account/SignedInUserModel';

const useStyles = makeStyles(theme => ({
  container: {
    paddingTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
}));

type props = {
  signedInUser?: SignedInUser,
};

const AccountPage: React.FC<props & RouteComponentProps> = ({ signedInUser }) => {
  const classes = useStyles();
  // should not happen
  if (!signedInUser) return null;
  return (
    <Container className={classes.container}>
      <Typography variant='h5'>
        Hi, {signedInUser.FirstName}.
      </Typography>
      <Typography variant='h6'>
        More account options coming soon. You can still update your phone and payment details when reviewing your cart
      </Typography>
    </Container>
  );
}

const mapStateToProps = (state: RootState) => ({
  signedInUser: state.Account.SignedInUser,
});

export default connect(mapStateToProps)(AccountPage);
