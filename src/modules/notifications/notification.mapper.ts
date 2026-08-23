import { Notification } from '../../generated/prisma/client';
import {
  ENotificationType,
  INotification,
} from '../../types/notification';

export function toNotification(
  notification: Notification,
): INotification {
  return {
    id: notification.id,
    userId: notification.userId,
    familyId:
      notification.familyId ?? undefined,
    type: notification.type as ENotificationType,
    title: notification.title,
    body: notification.body ?? undefined,
    data: notification.data
      ? (notification.data as Record<
          string,
          unknown
        >)
      : undefined,
    readAt:
      notification.readAt?.toISOString(),
    createdAt:
      notification.createdAt.toISOString(),
  };
}
