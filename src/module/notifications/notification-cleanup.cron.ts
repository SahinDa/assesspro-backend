import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { NotificationsRepository } from "./notifications.repository";
import { NotificationsService } from "./notifications.service";

@Injectable()
export class NotificationsCleanupService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private readonly notificationsRepository: NotificationsRepository) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleOldNotificationsCleanup() {
        try {
            this.logger.log('Running cron job: Deleting notifications older than 1 month...');
            
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            const deletedCount = await this.notificationsRepository.deleteOldNotifications(oneMonthAgo);
            
            this.logger.log(`Cleanup complete. Successfully deleted ${deletedCount} old notifications.`);
        } catch (error) {
            this.logger.error('Failed to clean up old notifications', error.stack);
        }
    }
}