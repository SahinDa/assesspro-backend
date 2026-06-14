import { Injectable } from "@nestjs/common";
import { SubscriptionRepository } from "./subscription.repository";

@Injectable()
export class SubscriptionService{
    constructor(private readonly subscriptionrepository : SubscriptionRepository){}
}