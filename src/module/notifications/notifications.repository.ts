import { Injectable } from '@nestjs/common';
import { CreateInAppNotificationDto } from './dto/createinappnotification.dto';
import { DataSource } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import {NotificationFilterEnum } from 'src/config/enum';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly dataSource: DataSource) {}
  async createInAppNotification(input: CreateInAppNotificationDto) {
    try {
      const repo = this.dataSource.getRepository(NotificationEntity);
      const notification = repo.create({
        user_id: input.userId ?? null,
        org_id: input.orgId,
        is_global: input.is_global ?? false,
        subject: input.subject,
        message: input.message,
        url: input.url ?? null,
        is_pinned: input.isPinned ?? false,
      });

      return await repo.save(notification);
    } catch (err) {
      throw err;
    }
  }

  async getNotifications(
    userId: string,
    orgId: string,
    limit: number = 20,
    offset: number = 0,
    type?:NotificationFilterEnum,
  ): Promise<NotificationEntity[]> {
const query: FindOptionsWhere<NotificationEntity>[] = [];

  if (type === NotificationFilterEnum.GLOBAL) {
    query.push({ org_id: orgId, is_global: true });
    // If platform-wide Admin broadcasts have org_id = null, include:
    // where.push({ org_id: IsNull(), is_global: true });
  } else if (type === NotificationFilterEnum.PERSONAL) {
    query.push({ org_id: orgId, user_id: userId, is_global: false });
  } else {
    // All (when `type` is omitted)
    query.push(
      { org_id: orgId, user_id: userId, is_global: false },
      { org_id: orgId, is_global: true },
      // { org_id: IsNull(), is_global: true },
    );
  }
    return this.dataSource.getRepository(NotificationEntity).find({
    where : query,
    order: {
      is_pinned: 'DESC',
      created_at: 'DESC',
    },
    take: limit,
    skip: offset,
  });
    
  }
  
async deleteNotification(notificationId:string,userId:string,orgId:string){
const repo = this.dataSource.getRepository(NotificationEntity);

  // Organization role: can only delete its own global broadcasts
  if (orgId) {
    const result = await repo.delete({
      notification_id: notificationId,
      org_id: orgId,
      is_global: true,
    });
    return result.affected ?? 0;
  }

  // Student / direct recipient: can only delete their own personal notifications
  const result = await repo.delete({
    notification_id: notificationId,
    user_id: userId,
    is_global: false,
  });
  return result.affected ?? 0;
}
  
  async deleteOldNotifications(oneMonthAgo: Date): Promise<number> {
    const result = await this.dataSource
      .getRepository(NotificationEntity)
      .createQueryBuilder('notification')
      .delete()
      .where('created_at < :oneMonthAgo', { oneMonthAgo })
      .execute();

    return result.affected || 0;
  }
}
