export enum NotificationActionTypes {
  NOTIFICATION_ERROR = 'NOTIFICATION_ERROR',
  NOTIFICATION_SUCCESS = 'NOTIFICATION_SUCCESS',
  CLEAR_NOTIFICATION = 'CLEAR_NOTIFICATION',
}

interface NotificationSuccessAction {
  type: NotificationActionTypes.NOTIFICATION_SUCCESS
  message: string
};

interface NotificationErrorAction {
  type: NotificationActionTypes.NOTIFICATION_ERROR
  message: string
};

interface ClearNotificationAction {
  type: NotificationActionTypes.CLEAR_NOTIFICATION
};

export type NotificationActions = NotificationErrorAction |NotificationSuccessAction | ClearNotificationAction;

export const notificationErrorAction = (message: string): NotificationErrorAction => ({
  type: NotificationActionTypes.NOTIFICATION_ERROR,
  message,
});

export const notificationSuccessAction = (message: string): NotificationSuccessAction => ({
  type: NotificationActionTypes.NOTIFICATION_SUCCESS,
  message,
});

export const  notificationClearAction = (): ClearNotificationAction => ({
  type: NotificationActionTypes.CLEAR_NOTIFICATION,
});
  