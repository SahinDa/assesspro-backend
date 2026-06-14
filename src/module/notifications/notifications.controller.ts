import { Controller, Get, Patch, Post } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsservice : NotificationsService){}

    //this single endpoint is responsible for sending all kind of notificaton
    @Post()
    async sendNotification(){}

    
    //return all notification based on one user 
    @Get()
    async getAllUserNotification(){}

    @Get(":notificationId")
    async getNotificationDetails(){}

    //mark as read
    @Patch()
    async markNotification(){}
}