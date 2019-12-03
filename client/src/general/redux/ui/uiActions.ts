import { NotificationActions } from 'general/redux/ui/notification/notificationActions';
import AnalyticsService from 'analytics/analyticsService';
import events from 'analytics/events';
export enum UiActionTypes {
  TOGGLE_MOBILE_DRAWER = 'TOGGLE_MOBILE_DRAWER',
}

export interface ToggleMobileDrawerAction {
  type: UiActionTypes.TOGGLE_MOBILE_DRAWER
}

export type UiActions = ToggleMobileDrawerAction | NotificationActions

export const toggleMobileDrawerAction = (): ToggleMobileDrawerAction => {
  AnalyticsService.trackEvent(events.TOGGLE_MOBILE_DRAWER);
  return { type: UiActionTypes.TOGGLE_MOBILE_DRAWER, }
}
