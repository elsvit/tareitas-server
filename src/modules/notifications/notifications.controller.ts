import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload';

import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * GET /notifications/me
   */
  @Get('me')
  listMyNotifications(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notificationsService.listForUser(
      user.sub,
      query.unreadOnly,
    );
  }

  /**
   * GET /notifications/me/unread-count
   */
  @Get('me/unread-count')
  getUnreadCount(
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notificationsService.getUnreadCount(
      user.sub,
    );
  }

  /**
   * PATCH /notifications/me/read-all
   */
  @Patch('me/read-all')
  markAllAsRead(
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notificationsService.markAllAsRead(
      user.sub,
    );
  }

  /**
   * PATCH /notifications/:notificationId/read
   */
  @Patch(':notificationId/read')
  markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('notificationId')
    notificationId: string,
  ) {
    return this.notificationsService.markAsRead(
      user.sub,
      notificationId,
    );
  }
}
