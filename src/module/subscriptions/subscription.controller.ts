import { Controller, Delete, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { RoleGuard } from "src/guards/role.guard";

@Controller('subscription')
@UseGuards(RoleGuard)
export class SubscriptionController{
    constructor(private readonly subscriptionservice : SubscriptionService){}

    //platform
    @Post('platform')
    async createPlatformPlan(){}

    @Get('platform/:planId')
    async getPlatformPlan(){}

    @Get('platform/all')
    async getAllPlatformPlan(){}

    @Patch('platform/:planId')
    async updatePlatformPlan(){}

    @Delete('platform/:planId')
    async removedPlatformPlan(){}

    @Get('platform/:organizationId')
    async getAllPlanBasedOnOrganization(){}

    
    //organization plan
    @Post('organization')
    async createOrganizationPlan(){}

    @Get('organization/:planId')
    async getOrganizationPlan(){}

    @Patch('organization/:planId')
    async updateOrganizationPlan(){}

    @Delete('organization/:planId')
    async removedOrganizationPlan(){}

   //transaction
   @Post('organization/transaction')
   async createOrganizationTransaction(){}
   
   @Get('organization/transaction/:transactionId')
   async getOrganizationTransacton(){}

    @Get('organization/transaction/all')
   async getAllOrganizationTransacton(){}

   @Post('user/transaction')
   async createUserTransaction(){}
   
   @Get('user/transaction/:transactionId')
   async getUserTransacton(){}

    @Get('user/transaction/all')
   async getAllUserTransacton(){}


}