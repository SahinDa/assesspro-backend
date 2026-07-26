import { Injectable, UnauthorizedException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { CreateInAppNotificationDto } from './dto/createinappnotification.dto';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { OrganizationsService } from '../organizations/organizations.service';
import { UserRole } from 'src/config/enum';
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

  async getNotifications(
    organization: IOrganization,
    offset: number,
    limit: number,
    orgId?: string,
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
        limit,
        offset,
      );
    } catch (err) {
      throw new Error('Could not fetch notifications');
    }
  }
}
