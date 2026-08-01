import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrganizationTransaction } from "./entities/organizationtransaction.entity";
import { StudentTransaction } from "./entities/studenttransaction.entity";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { PaymentsRepository } from "./payments.repository";
import { SubscriptionModule } from "../subscriptions/subscription.module";
import { TransactionsController } from "./transactions.controller";

@Module({
 imports:[
    TypeOrmModule.forFeature([OrganizationTransaction,StudentTransaction]),
    forwardRef(() => SubscriptionModule ),
],
 controllers:[PaymentsController,TransactionsController],
 providers:[PaymentsService,PaymentsRepository],
 exports:[PaymentsService,PaymentsRepository]
})

export class PaymentsModule {}