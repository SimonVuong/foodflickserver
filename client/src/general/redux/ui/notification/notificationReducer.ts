import { NotificationActions, NotificationActionTypes } from './notificationActions';

// lowercase instead of capitalized so theme.ts can use these as fields in CommonColor.
// ex: theme.pallete.common.success vs theme.pallete.common.SUCCESS
export enum NotificationTypes {
  success = 'success',
  warning = 'warning',
  error = 'error',
}

interface INotificationState {
  message: string;
  type: NotificationTypes;
  doesAutoHide: boolean,
}

export class NotificationState implements INotificationState {
  private readonly _message: string;
  private readonly _type: NotificationTypes;
  private readonly _doesAutoHide: boolean;

  public constructor({
    message,
    type,
    doesAutoHide,
  }: INotificationState) {
    this._message = message;
    this._type = type;
    this._doesAutoHide = doesAutoHide;
  }
  
  public get message() { return this._message }
  public get type() { return this._type }
  public get doesAutoHide() { return this._doesAutoHide }
};

export type NotificationStateReducer = NotificationState | null | undefined;

export function snackReducer(state: NotificationStateReducer = null , action: NotificationActions): NotificationStateReducer {
  switch(action.type) {
    case NotificationActionTypes.NOTIFICATION_ERROR:
      return new NotificationState({
        message: action.message,
        type: NotificationTypes.error,
        doesAutoHide: false,
      });
    case NotificationActionTypes.NOTIFICATION_SUCCESS:
      return new NotificationState({
        message: action.message,
        type: NotificationTypes.success,
        doesAutoHide: true,
      });
    case NotificationActionTypes.CLEAR_NOTIFICATION:
      return null;
    default:
      return state
  }
}
