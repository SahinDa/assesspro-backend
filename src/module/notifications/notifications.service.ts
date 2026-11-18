import { 
  Injectable, 
  UnauthorizedException, 
  ForbiddenException,
  NotFoundException,
  HttpException,
  InternalServerErrorException,
  } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { CreateInAppNotificationDto } from './dto/createinappnotification.dto';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { OrganizationsService } from '../organizations/organizations.service';
import { UserRole, NotificationFilterEnum } from 'src/config/enum';
import { NotificationEntity } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsrepository: NotificationsRepository,
    private readonly organizationsservice: OrganizationsService,
  ) {}
  async createInAppNotification(input: CreateInAppNotificationDto) {
    try {
      await this.notificationsrepository.createInAppNotification(input);
    } catch (err) {
      console.log('fail to add notification ');
    }
  }
async sendAnnouncement(
  organization: IOrganization,
  input: CreateInAppNotificationDto,
) {
  if (
    organization.role !== UserRole.ADMIN &&
    organization.role !== UserRole.ORGANIZATION
  ) {
    throw new ForbiddenException(
      'Only admins and organizations can publish announcements',
    );
  }

  const isAdmin = organization.role === UserRole.ADMIN;

  try {
    await this.notificationsrepository.createInAppNotification({
      ...input,
      userId: null,
      orgId: isAdmin ? null : organization.org_id,
      is_global: true,
      isPinned: input.isPinned ?? false,
    });
    return { 
      message:"Announcement saved Successfully",
    };
  } catch (err) {
    if (err instanceof HttpException) throw err;
    throw new InternalServerErrorException('Failed to publish announcement');
  }
}  

  async getNotifications(
    organization: IOrganization,
    offset: number,
    limit: number,
    orgId?: string,
    type?:NotificationFilterEnum,
  ): Promise<NotificationEntity[]> {
    try {
      let targetOrgId = orgId;

      if (organization.role === UserRole.ORGANIZATION) {
        targetOrgId = organization.org_id;
      } else {
        if (!targetOrgId) {
          throw 'Organization ID is required';
        }

        const isValid =
          await this.organizationsservice.isValidUserOrganizationRelation(
            organization.user_id,
            targetOrgId,
          );
        if (!isValid) {
          throw new UnauthorizedException(
            'You are not authorized to view notifications for this organization',
          );
        }
      }

      return await this.notificationsrepository.getNotifications(
        organization.user_id,
        targetOrgId,
        organization.role,
        limit,
        offset,
        type,
      );
    } catch (err) {
      throw new Error('Could not fetch notifications');
    }
  }
 async deleteNotification(
  organization: IOrganization,
  notificationId: string,
){
   try{
     //for organization org_id is a valid id so if org id is there 
     const isDeleted = await this.notificationsrepository.deleteNotification(notificationId,organization.user_id,organization.org_id);
     if (!isDeleted) {
      throw new NotFoundException(
        'Notification not found or cannot be deleted',
      );
    }

    return { 
      message:"Notification deleted Successfully",
    };
   }catch (err) {
    if (err instanceof HttpException) throw err;
    throw new InternalServerErrorException('Could not delete notification');
  }
 }
}
