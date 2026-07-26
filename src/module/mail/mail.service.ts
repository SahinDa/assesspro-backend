import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendMail(
    to: string, 
    subject: string, 
    templateName: string, 
    context: Record<string, any>
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template: `./${templateName}`,
        context,
      });
      this.logger.log(`Email successfully dispatched to ${to} using template: [${templateName}]`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} using template [${templateName}]`, error.stack);
      throw new Error('Could not send email. Please try again later.');
    }
  }
}