import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AttemptsRepository } from './attempts.repository';
import { AttemptsService } from './attempts.service';

@Injectable()
export class AttemptsCronService {
    private readonly logger = new Logger(AttemptsCronService.name);

    constructor(
       private readonly attemptsrepository: AttemptsRepository,
       private readonly attemptsservices: AttemptsService,
    ) {}

    // Runs once every hour to collect the "ghost" attempts left behind
    @Cron(CronExpression.EVERY_HOUR)
    async handleAbandonedExams() {
        this.logger.log('CRON: Executing background sweep for abandoned exams...');

        try {
            const batchSize = 100;
            let fetchedCount = 0;

            do {
                // 1. Fetch only attempt_id and user_id for matching criteria
                const expiredAttempts = await this.attemptsrepository.getExpiredAndAbandonedAttempts(batchSize);
                fetchedCount = expiredAttempts.length;

                if (fetchedCount === 0) break;

                this.logger.log(`CRON: Auto-finalizing a batch of ${fetchedCount} expired exams.`);

                // 2. Map directly to your dedicated backend grading function
                const processingPromises = expiredAttempts.map(async (attempt) => {
                    try {
                        await this.attemptsservices.autoFinalizeExpiredAttempt(attempt.user_id, attempt.attempt_id);
                        this.logger.log(`CRON: Successfully processed attempt ${attempt.attempt_id}`);
                    } catch (error) {
                        this.logger.error(`CRON: Error processing attempt ${attempt.attempt_id}: ${error.message}`);
                    }
                });

                // Execute batch concurrently safely
                await Promise.all(processingPromises);

            } while (fetchedCount === batchSize);

            this.logger.log('CRON: Background sweep iteration completed.');
        } catch (err) {
            this.logger.error(`CRON: Fatal exception encountered during execution: ${err.message}`);
        }
    }
}