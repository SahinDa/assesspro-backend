import {
  Controller,
  Get,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Organization } from 'src/decorators/organization.decorator';
import { IOrganization } from 'src/interfaces/organization.interfaces';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsservice: NotificationsService) {}

  //this single endpoint is responsible for sending all kind of notificaton
  @Post()
  async sendNotification() {}

  //return all notification based on one user
  @Get()
  async getAllUserNotification(
    @Organization() organization: IOrganization,
    @Query('id', new ParseUUIDPipe({ version: '4', optional: true }))
    orgId?: string,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    return await this.notificationsservice.getNotifications(
      organization,
      offset,
      limit,
      orgId,
    );
  }

  @Get(':notificationId')
  async getNotificationDetails() {}

  //mark as read
  @Patch()
  async markNotification() {}
}
