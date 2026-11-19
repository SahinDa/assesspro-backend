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
  Body,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Organization } from 'src/decorators/organization.decorator';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import {NotificationFilterEnum } from 'src/config/enum';
import { CreateInAppNotificationDto } from './dto/createinappnotification.dto';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UserRole } from 'src/config/enum';

@Controller('notifications')
@UseGuards(RoleGuard)
export class NotificationsController {
  constructor(private readonly notificationsservice: NotificationsService) {}

  //this single endpoint is responsible for sending all kind of notificaton
  @Post()
  @Roles(UserRole.ORGANIZATION, UserRole.ADMIN)
  async sendAnnouncement(
  @Organization() organization: IOrganization,
  @Body() input: CreateInAppNotificationDto,
) {
  return await this.notificationsservice.sendAnnouncement(organization, input);
}

  //return all notification based on one user
  @Get()
  @Roles(UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.ADMIN)
  async getAllUserNotification(
    @Organization() organization: IOrganization,
    @Query('orgId', new ParseUUIDPipe({ version: '4', optional: true }))
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
  @Roles(UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.ADMIN)
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
