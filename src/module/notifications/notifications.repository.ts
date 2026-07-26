import { Injectable } from '@nestjs/common';
import { CreateInAppNotificationDto } from './dto/createinappnotification.dto';
import { DataSource } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
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
  ): Promise<NotificationEntity[]> {
    return await this.dataSource.getRepository(NotificationEntity).find({
      where: [
        { org_id: orgId, user_id: userId },
        { org_id: orgId, is_global: true },
      ],
      order: {
        is_pinned: 'DESC',
        created_at: 'DESC',
      },
      take: limit, // LIMIT
      skip: offset, // OFFSET
    });
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
