import {
  Controller,
  Get,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Organization } from 'src/decorators/organization.decorator';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import {NotificationFilterEnum } from 'src/config/enum';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsservice: NotificationsService) {}

  //this single endpoint is responsible for sending all kind of notificaton
  @Post()
  async sendAnnouncement(
  @Organization() organization: IOrganization,
  @Body() input: CreateInAppNotificationDto,
) {
  return await this.notificationsservice.sendAnnouncement(organization, input);
}

  //return all notification based on one user
  @Get()
  async getAllUserNotification(
    @Organization() organization: IOrganization,
    @Query('id', new ParseUUIDPipe({ version: '4', optional: true }))
    orgId?: string,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('type', new ParseIntPipe({ optional: true })) type?:NotificationFilterEnum ,
  ) {
    return await this.notificationsservice.getNotifications(
      organization,
      offset,
      limit,
      orgId,
      type,
    );
  }
  
  @Delete(':notificationId')
  async deleteNotification(
    @Organization() organization: IOrganization,
      @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ){
    return await this.notificationsservice.deleteNotification(organization,notificationId);
  }
  
  @Get(':notificationId')
  async getNotificationDetails() {}

  //mark as read
  @Patch()
  async markNotification() {}
}
