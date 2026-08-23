import {
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { toNotification } from './notification.mapper';
import {
  CreateNotificationInput,
  NotificationsRepository,
} from './notifications.repository';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(
    NotificationsService.name,
  );

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  listForUser(
    userId: string,
    unreadOnly = false,
  ) {
    return this.notificationsRepository
      .findForUser(userId, unreadOnly)
      .then((items) =>
        items.map(toNotification),
      );
  }

  getUnreadCount(userId: string) {
    return this.notificationsRepository
      .countUnread(userId)
      .then((count) => ({ count }));
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ) {
    const notification =
      await this.notificationsRepository.findByIdForUser(
        userId,
        notificationId,
      );

    if (!notification) {
      throw new AppException(
        ErrorCode.NOTIFICATION_NOT_FOUND,
        'Notification not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!notification.readAt) {
      await this.notificationsRepository.markAsRead(
        userId,
        notificationId,
      );
    }

    return toNotification({
      ...notification,
      readAt:
        notification.readAt ?? new Date(),
    });
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepository.markAllAsRead(
      userId,
    );

    return { success: true };
  }

  notify(input: CreateNotificationInput) {
    return this.notificationsRepository.create(
      input,
    );
  }

  notifyMany(inputs: CreateNotificationInput[]) {
    if (inputs.length === 0) {
      return Promise.resolve();
    }

    return this.notificationsRepository.createMany(
      inputs,
    );
  }

  async notifyParents(
    familyId: string,
    input: Omit<
      CreateNotificationInput,
      'userId'
    >,
    excludeUserId?: string,
  ) {
    const parents =
      await this.notificationsRepository.findParentsInFamily(
        familyId,
        excludeUserId,
      );

    return this.notifyMany(
      parents.map((parent) => ({
        ...input,
        userId: parent.userId,
        familyId,
      })),
    );
  }

  async notifySafely(
    input: CreateNotificationInput,
  ) {
    try {
      await this.notify(input);
    } catch (error) {
      this.logger.error(
        'Failed to create notification',
        error,
      );
    }
  }

  async notifyManySafely(
    inputs: CreateNotificationInput[],
  ) {
    try {
      await this.notifyMany(inputs);
    } catch (error) {
      this.logger.error(
        'Failed to create notifications',
        error,
      );
    }
  }

  async notifyParentsSafely(
    familyId: string,
    input: Omit<
      CreateNotificationInput,
      'userId'
    >,
    excludeUserId?: string,
  ) {
    try {
      await this.notifyParents(
        familyId,
        input,
        excludeUserId,
      );
    } catch (error) {
      this.logger.error(
        'Failed to notify parents',
        error,
      );
    }
  }
}
