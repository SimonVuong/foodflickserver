import { NotificationActionTypes, NotificationActions } from 'general/redux/ui/notification/notificationActions';
import { UiActions, UiActionTypes } from './uiActions';
import { NotificationState, NotificationStateReducer, snackReducer } from 'general/redux/ui/notification/notificationReducer';

interface IUiState {
  isMobileDrawerOpen: boolean;
  notification: NotificationStateReducer;
}

export class UiState {
  private readonly _isMobileDrawerOpen: boolean;
  private readonly _notification: NotificationStateReducer;

  public constructor({
    isMobileDrawerOpen,
    notification: snack,
  }: IUiState) {
    this._isMobileDrawerOpen = isMobileDrawerOpen;
    this._notification = snack ? new NotificationState(snack) : snack;
  }
  
  public get isMobileDrawerOpen() { return this._isMobileDrawerOpen }
  public get notification() { return this._notification }
};

const initialState: UiState = new UiState({
  isMobileDrawerOpen: true,
  notification: undefined,
});

export const uiReducer = (state = initialState, action: UiActions): UiState => {
  switch(action.type) {
    case UiActionTypes.TOGGLE_MOBILE_DRAWER:
      return new UiState({
        isMobileDrawerOpen: !state.isMobileDrawerOpen,
        notification: snackReducer(state.notification, action as unknown as NotificationActions),
      });
    case NotificationActionTypes.NOTIFICATION_ERROR:
    case NotificationActionTypes.NOTIFICATION_SUCCESS:
    case NotificationActionTypes.CLEAR_NOTIFICATION:
      return new UiState({
        isMobileDrawerOpen: state.isMobileDrawerOpen,
        notification: snackReducer(state.notification, action)
      });
    default:
      return state
  }
}
