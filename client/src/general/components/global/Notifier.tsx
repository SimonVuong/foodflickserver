import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Snackbar, SnackbarContent, Button } from '@material-ui/core';
import { RootState, RootActions } from 'general/redux/rootReducer';
import { connect } from 'react-redux';
import { NotificationStateReducer, NotificationTypes } from 'general/redux/ui/notification/notificationReducer';
import { notificationClearAction } from 'general/redux/ui/notification/notificationActions';
import { ThunkDispatch } from 'redux-thunk';

type props = {
  notification: NotificationStateReducer,
  clearNotification: () => void,
}

const useStyles = makeStyles(theme => ({
  snackContent: {
    backgroundColor: ({ notification }: props) => theme.palette.common[notification ? notification.type : NotificationTypes.success],
    fontWeight: theme.typography.fontWeightBold,
  },
  confirm: {
    color: theme.palette.common.white,
  }
}));

const Notifier: React.FC<props> = props => {
  const classes = useStyles(props);
  const { notification, clearNotification } = props;
  const onClose = () => {
    clearNotification();
  };
  if (!notification) return null;
  const { message, doesAutoHide } = notification;
  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      autoHideDuration={doesAutoHide ? 2000 : null}
      open={!!message}
      onClose={onClose} // so clicking outside the snack also closes
    >
      <SnackbarContent
        message={message}
        className={classes.snackContent}
        action={
          <Button className={classes.confirm} onClick={onClose}>OKAY</Button>
        }
      />
    </Snackbar>
  );
}

const mapStateToProps = (state: RootState) => ({
  notification: state.Ui.notification,
});

const mapDispatchToProps = (dispatch: ThunkDispatch<RootState, null, RootActions>) => ({
  clearNotification: () => dispatch(notificationClearAction())
});

export default connect(mapStateToProps, mapDispatchToProps)(Notifier);