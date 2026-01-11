/**
 * Navigation Ref
 * За достъп до navigation обекта извън React компоненти
 * Използва се за navigation от push notifications
 */

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}

