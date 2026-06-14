import { Module } from "@nestjs/common";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionService } from "./subscription.service";
import { SubscriptionRepository } from "./subscription.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrganizationPlan } from "./entities/organizationplans.entity";
import { OrganizationTransaction } from "./entities/organizationtransaction.entity";
import { PlatformPlan } from "./entities/platformplan.entity";
import { StudentTransaction } from "./entities/studenttransaction.entity";
import { OrgSubscription } from "./entities/subscriptionsorganization.entity";
import { UserSubscription } from "./entities/subscriptionsuser.entity";

@Module({
 imports:[TypeOrmModule.forFeature([OrganizationPlan,OrganizationTransaction,PlatformPlan,StudentTransaction,OrgSubscription,UserSubscription])],
 controllers:[SubscriptionController],
 providers:[SubscriptionService,SubscriptionRepository],
 exports:[SubscriptionService,SubscriptionRepository]
})

export class SubscriptionModule {}