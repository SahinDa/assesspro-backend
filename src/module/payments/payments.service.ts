import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { SubscriptionService } from '../subscriptions/subscription.service';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import {
  CreateOrderDto,
  MarkPaymentFailedDto,
  VerifyPaymentDto,
} from './dto/payments.dto';
import {
  OrganizationBillingCycle,
  OrgBillingCycle,
  OrgPaymentGateway,
  OrgPaymentMethod,
  OrgTransactionFailureReason,
  OrgTransactionStatus,
  PlatformBillingCycle,
  StudentBillingCycle,
  StudentPaymentGateway,
  StudentPaymentMethod,
  StudentTransactionFailureReason,
  StudentTransactionStatus,
  UserRole,
} from 'src/config/enum';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  constructor(
    private readonly paymentrepository: PaymentsRepository,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionservice: SubscriptionService,
  ) {}

  async createOrder(organization: IOrganization, input: CreateOrderDto) {
    try {
      let plan;
      const planId = input.planId;
      const billingCycle = input.billingCycle;
      if (organization.role === UserRole.ORGANIZATION) {
        plan = await this.subscriptionservice.getPlatformPlan(
          organization,
          planId,
        );
      } else if (organization.role === UserRole.STUDENT) {
        plan = await this.subscriptionservice.getOrganizationPlanById(
          organization,
          planId,
        );
      }
      const price = plan.pricing[billingCycle];
      if (price === undefined || price === null) {
        throw new BadRequestException(
          'Price not found for the selected billing cycle',
        );
      }

      // Razorpay expects amounts in subunits (multiply by 100)
      const amountInSubunits = Math.round(Number(price) * 100);

      // 4. Create order on Razorpay
      const razorpayOrder = await this.razorpay.orders.create({
        amount: amountInSubunits,
        currency: plan.currency || 'INR',
        receipt: `receipt_${Date.now()}`,
      });

      if (organization.role === UserRole.ORGANIZATION) {
        await this.paymentrepository.createOrderForOrganization({
          orgId: organization.org_id,
          planName: plan.plan_name,
          planId: plan.plan_id,
          features: plan.features,
          amount: price,
          currency: plan.currency || 'INR',
          billingCycle: billingCycle as OrgBillingCycle,
          paymentGateway: OrgPaymentGateway.Razorpay,
          gatewayOrderId: razorpayOrder.id,
          status: OrgTransactionStatus.Pending,
        });
      } else if (organization.role === UserRole.STUDENT) {
        await this.paymentrepository.createOrderForStudent({
          userId: organization.user_id,
          planName: plan.plan_name,
          planId: plan.plan_id,
          organizationId: plan.org_id,
          amount: price,
          currency: plan.currency || 'INR',
          billingCycle: billingCycle as StudentBillingCycle,
          paymentGateway: StudentPaymentGateway.Razorpay,
          gatewayOrderId: razorpayOrder.id,
          status: StudentTransactionStatus.Pending,
          features: plan.features,
        });
      }

      // 6. Return the order object to the frontend
      return razorpayOrder;
    } catch (err) {
      throw err;
    }
  }

  async verifyPayment(organization: IOrganization, input: VerifyPaymentDto) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        input;

      // 1. Cryptographic Signature Verification
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const secret = process.env.RAZORPAY_KEY_SECRET!;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        if (organization.role === UserRole.ORGANIZATION) {
          await this.paymentrepository.markOrganizationOrderAsFailed({
            gatewayOrderId: razorpay_order_id,
            status: OrgTransactionStatus.Failed,
            failureReason: OrgTransactionFailureReason.FraudDetected,
          });
        } else if (organization.role === UserRole.STUDENT) {
          await this.paymentrepository.markStudentOrderAsFailed({
            gatewayOrderId: razorpay_order_id,
            status: StudentTransactionStatus.Failed,
            failureReason: StudentTransactionFailureReason.FraudDetected,
          });
        }
        throw new BadRequestException('Invalid payment signature');
      }

      // 2. Fetch payment details from Razorpay with Retry (Max 3 attempts)
      let paymentDetails;
      let fetchAttempts = 0;
      const maxFetchRetries = 3;

      while (fetchAttempts < maxFetchRetries) {
        try {
          paymentDetails =
            await this.razorpay.payments.fetch(razorpay_payment_id);
          break;
        } catch (fetchError) {
          fetchAttempts++;
          if (fetchAttempts >= maxFetchRetries) {
            console.error(
              `Failed to fetch payment details from Razorpay for ID ${razorpay_payment_id} after ${maxFetchRetries} attempts.`,
              fetchError,
            );
            throw new BadGatewayException(
              'Unable to verify payment with the gateway. Please try again later.',
            );
          }
          const delay = Math.pow(2, fetchAttempts - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      const methodString = paymentDetails?.method || 'other';

      // 3. Define database saving and activation block with Retry (Max 5 attempts)
      // Route based on Organization Role
      const persistWithRetry = async (attempt = 1): Promise<void> => {
        try {
          if (organization.role === UserRole.ORGANIZATION) {
            let paymentMethodEnum: OrgPaymentMethod;
            if (methodString === 'upi')
              paymentMethodEnum = OrgPaymentMethod.UPI;
            else if (methodString === 'card')
              paymentMethodEnum = OrgPaymentMethod.Card;
            else if (methodString === 'netbanking')
              paymentMethodEnum = OrgPaymentMethod.NetBanking;
            else if (methodString === 'wallet')
              paymentMethodEnum = OrgPaymentMethod.Wallet;
            else paymentMethodEnum = OrgPaymentMethod.Other;

            // Step A: Mark transaction as success in the database and get the record back
            const transactionRecord =
              await this.paymentrepository.markOrganizationOrderAsSuccess({
                gatewayOrderId: razorpay_order_id,
                gatewayTransactionId: razorpay_payment_id,
                paymentMethod: paymentMethodEnum,
                status: OrgTransactionStatus.Success,
              });

            // Step B: Call subscription service using details from the transaction record
            //save subscription details to subscription table
            await this.subscriptionservice.createOrUpdateOrgSubscription(
              transactionRecord,
            );
          } else if (organization.role === UserRole.STUDENT) {
            let paymentMethodEnum: StudentPaymentMethod;
            if (methodString === 'upi')
              paymentMethodEnum = StudentPaymentMethod.UPI;
            else if (methodString === 'card')
              paymentMethodEnum = StudentPaymentMethod.Card;
            else if (methodString === 'netbanking')
              paymentMethodEnum = StudentPaymentMethod.NetBanking;
            else if (methodString === 'wallet')
              paymentMethodEnum = StudentPaymentMethod.Wallet;
            else paymentMethodEnum = StudentPaymentMethod.Other;

            const userTransactionRecord =
              await this.paymentrepository.markStudentOrderAsSuccess({
                gatewayOrderId: razorpay_order_id,
                gatewayTransactionId: razorpay_payment_id,
                paymentMethod: paymentMethodEnum,
                status: StudentTransactionStatus.Success,
              });
            await this.subscriptionservice.createOrUpdateUserSubscription(
              userTransactionRecord,
            );

            // TODO: Activate student subscription plan here
          }
        } catch (dbError) {
          if (attempt < 5) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.warn(
              `Database write failed for order ${razorpay_order_id}. Retrying attempt ${attempt}/5 in ${delay}ms...`,
              dbError,
            );

            await new Promise((resolve) => setTimeout(resolve, delay));
            return persistWithRetry(attempt + 1);
          } else {
            console.error(
              `CRITICAL: Payment succeeded on gateway (${razorpay_payment_id}) but database sync failed permanently after 5 attempts.`,
              dbError,
            );
            throw new InternalServerErrorException(
              'Payment was successful, but subscription activation is delayed. Please contact support.',
            );
          }
        }
      };

      // Execute database persistence with retries
      await persistWithRetry();

      return {
        message: 'Payment verified and subscription activated successfully',
      };
    } catch (err) {
      throw err;
    }
  }
  async getOrganizationTransaction(transactionId: string) {
    try {
      return await this.paymentrepository.getOrganizationTransaction(
        transactionId,
      );
    } catch (err) {
      throw err;
    }
  }
  async getUserTransaction(transactionId: string) {
    try {
      return await this.paymentrepository.getUserTransaction(transactionId);
    } catch (err) {
      throw err;
    }
  }

  async markPaymentFailed(
    organization: IOrganization,
    input: MarkPaymentFailedDto,
  ) {
    try {
      const { gateway_order_id, error_reason } = input;

      // Map Razorpay's error string to your smallint Enum values safely
      let failureEnum:
        | OrgTransactionFailureReason
        | StudentTransactionFailureReason = 99;
      if (organization.role === UserRole.ORGANIZATION) {
        failureEnum = OrgTransactionFailureReason.Other;
      } else if (organization.role === UserRole.STUDENT) {
        failureEnum = StudentTransactionFailureReason.Other;
      }

      if (error_reason) {
        const reason = error_reason.toLowerCase();

        if (reason.includes('insufficient_funds')) {
          failureEnum =
            organization.role === UserRole.ORGANIZATION
              ? OrgTransactionFailureReason.InsufficientFunds
              : StudentTransactionFailureReason.InsufficientFunds;
        } else if (
          reason.includes('card_declined') ||
          reason.includes('payment_declined')
        ) {
          failureEnum =
            organization.role === UserRole.ORGANIZATION
              ? OrgTransactionFailureReason.CardDeclined
              : StudentTransactionFailureReason.CardDeclined;
        } else if (
          reason.includes('network') ||
          reason.includes('gateway_technical_error')
        ) {
          failureEnum =
            organization.role === UserRole.ORGANIZATION
              ? OrgTransactionFailureReason.NetworkError
              : StudentTransactionFailureReason.NetworkError;
        } else if (
          reason.includes('invalid_account') ||
          reason.includes('bank_account_invalid')
        ) {
          failureEnum =
            organization.role === UserRole.ORGANIZATION
              ? OrgTransactionFailureReason.InvalidAccount
              : StudentTransactionFailureReason.InvalidAccount;
        } else if (reason.includes('timed_out') || reason.includes('timeout')) {
          failureEnum =
            organization.role === UserRole.ORGANIZATION
              ? OrgTransactionFailureReason.PaymentTimeout
              : StudentTransactionFailureReason.PaymentTimeout;
        } else if (reason.includes('limit') || reason.includes('exceed')) {
          failureEnum =
            organization.role === UserRole.ORGANIZATION
              ? OrgTransactionFailureReason.ExceedsLimit
              : StudentTransactionFailureReason.ExceedsLimit;
        } else if (reason.includes('currency')) {
          failureEnum =
            organization.role === UserRole.ORGANIZATION
              ? OrgTransactionFailureReason.CurrencyMismatch
              : StudentTransactionFailureReason.CurrencyMismatch;
        } else if (reason.includes('duplicate')) {
          failureEnum =
            organization.role === UserRole.ORGANIZATION
              ? OrgTransactionFailureReason.DuplicateTransaction
              : StudentTransactionFailureReason.DuplicateTransaction;
        } else if (reason.includes('wallet')) {
          failureEnum =
            organization.role === UserRole.ORGANIZATION
              ? OrgTransactionFailureReason.WalletBalanceLow
              : StudentTransactionFailureReason.WalletBalanceLow;
        } else if (reason.includes('fraud')) {
          failureEnum =
            organization.role === UserRole.ORGANIZATION
              ? OrgTransactionFailureReason.FraudDetected
              : StudentTransactionFailureReason.FraudDetected;
        } else if (
          reason.includes('gateway_unavailable') ||
          reason.includes('unavailable')
        ) {
          failureEnum =
            organization.role === UserRole.ORGANIZATION
              ? OrgTransactionFailureReason.GatewayUnavailable
              : StudentTransactionFailureReason.GatewayUnavailable;
        } else if (
          reason.includes('cancelled') ||
          reason.includes('payment_cancelled')
        ) {
          failureEnum =
            organization.role === UserRole.ORGANIZATION
              ? OrgTransactionFailureReason.UserCancelled
              : StudentTransactionFailureReason.UserCancelled;
        }
      }

      // Branch execution based on role to avoid updating the wrong repository table
      if (organization.role === UserRole.ORGANIZATION) {
        const orgUpdated =
          await this.paymentrepository.markOrganizationOrderAsFailed({
            gatewayOrderId: gateway_order_id,
            status: OrgTransactionStatus.Failed,
            failureReason: failureEnum as OrgTransactionFailureReason,
          });

        if (orgUpdated) {
          return { message: 'Organization payment failure recorded' };
        }
      } else if (organization.role === UserRole.STUDENT) {
        const studentUpdated =
          await this.paymentrepository.markStudentOrderAsFailed({
            gatewayOrderId: gateway_order_id,
            status: StudentTransactionStatus.Failed,
            failureReason: failureEnum as StudentTransactionFailureReason,
          });

        if (studentUpdated) {
          return { message: 'Student payment failure recorded' };
        }
      }

      throw new NotFoundException(
        `Transaction record not found for order ID: ${gateway_order_id}`,
      );
    } catch (err) {
      throw err;
    }
  }

  //Transaction

  async getAllPlatformTransactions() {
    try {
      return this.paymentrepository.getAllPlatformTransactions();
    } catch (err) {
      throw err;
    }
  }
  async getPlatformTransactionsByOrgId(
    orgId: string,
    organization: IOrganization,
  ) {
    try {
      if (organization.role == UserRole.ORGANIZATION) {
        orgId = organization.org_id;
      }
      return await this.paymentrepository.getPlatformTransactionsByOrgId(orgId);
    } catch (err) {
      throw err;
    }
  }

  async getSinglePlatformTransaction(
    orgId: string,
    transactionId: string,
    organization: IOrganization,
  ) {
    try {
      if (organization.role == UserRole.ORGANIZATION) {
        orgId = organization.org_id;
      }
      return await this.paymentrepository.getSinglePlatformTransaction(
        orgId,
        transactionId,
      );
    } catch (err) {
      throw err;
    }
  }

  async getOrganizationStudentsTransactions(
    orgId: string,
    organization: IOrganization,
  ) {
    try {
      if (organization.role === UserRole.ORGANIZATION) {
        orgId = organization.org_id;
      }

      return await this.paymentrepository.findStudentTransactionsByOrgId(orgId);
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new InternalServerErrorException(
        'Failed to fetch organization student transactions',
      );
    }
  }

  async getStudentSingleTransaction(
    transactionId: string,
    userId: string,
    orgId: string,
    organization: IOrganization,
  ) {
    try {
      if (organization.role === UserRole.ORGANIZATION) {
        orgId = organization.org_id;
        if (!userId) {
          throw new BadRequestException(
            'Query parameter "userId" is required.',
          );
        }
      } else if (organization.role === UserRole.STUDENT) {
        userId = organization.user_id;
        if (!orgId) {
          throw new BadRequestException('Query parameter "orgId" is required.');
        }
      } else if (organization.role === UserRole.ADMIN) {
        if (!orgId || !userId) {
          throw new BadRequestException(
            'Both "orgId" and "userId" query parameters are required.',
          );
        }
      } else {
        throw new ForbiddenException('Unauthorized access.');
      }

      const transaction =
        await this.paymentrepository.findSingleStudentTransaction(
          orgId,
          userId,
          transactionId,
        );

      if (!transaction) {
        throw new NotFoundException(
          `Transaction with ID ${transactionId} not found.`,
        );
      }

      return transaction;
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      )
        throw err;
      throw new InternalServerErrorException(
        'Failed to fetch student transaction detail',
      );
    }
  }

  async getOneStudentAllTransactions(
    userId: string,
    orgId: string,
    organization: IOrganization,
  ) {
    try {
      // 1. If an Organization is logged in, lock the orgId and ensure a studentId was provided
      if (organization.role === UserRole.ORGANIZATION) {
        orgId = organization.org_id;
        if (!userId) {
          throw new BadRequestException(
            'Query parameter "userId" is required.',
          );
        }
      }
      // 2. If a Student is logged in, lock the userId to themselves and ensure an orgId was provided
      else if (organization.role === UserRole.STUDENT) {
        userId = organization.user_id; // Adjust property name based on your user interface (e.g., id or user_id)
        if (!orgId) {
          throw new BadRequestException('Query parameter "orgId" is required.');
        }
      }
      // 3. If an Admin is logged in, ensure both parameters are explicitly supplied
      else if (organization.role === UserRole.ADMIN) {
        if (!orgId || !userId) {
          throw new BadRequestException(
            'Both "orgId" and "userId" query parameters are required for admin requests.',
          );
        }
      } else {
        throw new ForbiddenException('Unauthorized access.');
      }

      return await this.paymentrepository.findStudentTransactionsByUserId(
        orgId,
        userId,
      );
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new InternalServerErrorException(
        'Failed to fetch transactions for student',
      );
    }
  }
}
