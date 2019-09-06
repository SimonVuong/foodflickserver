import { NotificationActions } from 'general/redux/ui/notification/notificationActions';

export enum UiActionTypes {
  TOGGLE_MOBILE_DRAWER = 'TOGGLE_MOBILE_DRAWER',
}

export interface ToggleMobileDrawerAction {
  type: UiActionTypes.TOGGLE_MOBILE_DRAWER
}

export type UiActions = ToggleMobileDrawerAction | NotificationActions

export const toggleMobileDrawerAction = (): ToggleMobileDrawerAction => ({
  type: UiActionTypes.TOGGLE_MOBILE_DRAWER,
})
