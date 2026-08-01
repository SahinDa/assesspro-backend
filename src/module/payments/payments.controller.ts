import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Organization } from 'src/decorators/organization.decorator';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import {
  CreateOrderDto,
  MarkPaymentFailedDto,
  VerifyPaymentDto,
} from './dto/payments.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsservice: PaymentsService) {}

  // ==========================================
  // PAYMENT & ORDER EXECUTION FLOWS
  // ==========================================

  /*
      ====================================================================
      RAZORPAY FULL PAYMENT FLOW (End-to-End Architecture)
      ====================================================================
      [STEP 1] Frontend initiates request: 
               User clicks "Subscribe" and frontend calls POST /create-order.
      [STEP 2] Backend registers order: 
               Backend calls Razorpay API (orders.create) with amount & currency.
      [STEP 3] Backend responds to frontend: 
               Backend sends the generated `order_id`, amount, and Key ID back.
      [STEP 4] Frontend initializes SDK (Frontend Code): 
               Frontend passes order_id and config into `new Razorpay(options)`.
      [STEP 5] Popup opens (Frontend Code): 
               Frontend calls `rzp.open()` to show the payment modal to the user.
      [STEP 6] Razorpay triggers handler (Frontend Code): 
               After payment success, Razorpay gives frontend payment tokens.
      [STEP 7] Frontend verifies payment: 
               Frontend sends tokens to backend POST /verify-payment to 
               cryptographically verify signature, save transaction, and activate plan.
      ====================================================================
    */

  // - Generates a secure Razorpay order ID using database plan pricing.
  @Post('/create-order')
  async createOrder(
    @Organization() organization: IOrganization,
    @Body() input: CreateOrderDto,
  ) {
    return await this.paymentsservice.createOrder(organization, input);
  }
  // - Validates cryptographic signatures, saves transaction records, and activates subscriptions.
  @Post('/verify-payment')
  async verifyPayment(
    @Organization() organization: IOrganization,
    @Body() input: VerifyPaymentDto,
  ) {
    return await this.paymentsservice.verifyPayment(organization, input);
  }
  @Post('/mark-failed')
  async markPaymentFailed(
    @Organization() organization: IOrganization,
    @Body() input: MarkPaymentFailedDto,
  ) {
    return await this.paymentsservice.markPaymentFailed(organization, input);
  }
}
