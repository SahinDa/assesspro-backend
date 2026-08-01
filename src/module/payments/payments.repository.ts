import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CreateOrgOrder,
  CreateStudentOrder,
} from './interface/order.interface';
import { OrganizationTransaction } from './entities/organizationtransaction.entity';
import {
  OrgPaymentMethod,
  OrgTransactionFailureReason,
  OrgTransactionStatus,
  PlatformBillingCycle,
  StudentPaymentMethod,
  StudentTransactionFailureReason,
  StudentTransactionStatus,
} from 'src/config/enum';
import { StudentTransaction } from './entities/studenttransaction.entity';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly datasource: DataSource) {}
  async createOrderForOrganization(input: CreateOrgOrder) {
    try {
      const repo = this.datasource.getRepository(OrganizationTransaction);
      const order = repo.create({
        organization_id: input.orgId,
        plan_name: input.planName,
        plan_id: input.planId,
        billing_cycle: input.billingCycle,
        amount: input.amount,
        currency: input.currency,
        payment_gateway: input.paymentGateway,
        gateway_order_id: input.gatewayOrderId,
        status: input.status,
        features: input.features,
      });
      await repo.save(order);
    } catch (err) {
      throw err;
    }
  }
  async createOrderForStudent(input: CreateStudentOrder) {
    try {
      const repo = this.datasource.getRepository(StudentTransaction);
      const order = repo.create({
        user_id: input.userId,
        organization_id: input.organizationId,
        plan_name: input.planName,
        plan_id: input.planId,
        billing_cycle: input.billingCycle,
        amount: input.amount,
        currency: input.currency,
        payment_gateway: input.paymentGateway,
        gateway_order_id: input.gatewayOrderId,
        status: input.status,
        features: input.features,
      });
      await repo.save(order);
    } catch (err) {
      throw err;
    }
  }
  async markOrganizationOrderAsSuccess(input: {
    gatewayOrderId: string;
    gatewayTransactionId: string;
    paymentMethod?: OrgPaymentMethod;
    status: OrgTransactionStatus;
  }) {
    const repo = this.datasource.getRepository(OrganizationTransaction);

    const transaction = await repo.findOne({
      where: { gateway_order_id: input.gatewayOrderId },
    });

    if (!transaction) {
      throw new Error(
        `Organization transaction not found for order ID: ${input.gatewayOrderId}`,
      );
    }

    transaction.gateway_transaction_id = input.gatewayTransactionId;
    transaction.payment_method = input.paymentMethod;
    transaction.status = input.status;

    return await repo.save(transaction);
  }

  async markStudentOrderAsSuccess(input: {
    gatewayOrderId: string;
    gatewayTransactionId: string;
    paymentMethod?: StudentPaymentMethod;
    status: StudentTransactionStatus;
  }) {
    const repo = this.datasource.getRepository(StudentTransaction);

    const transaction = await repo.findOne({
      where: { gateway_order_id: input.gatewayOrderId },
    });

    if (!transaction) {
      throw new Error(
        `Student transaction not found for order ID: ${input.gatewayOrderId}`,
      );
    }

    transaction.gateway_transaction_id = input.gatewayTransactionId;
    transaction.payment_method = input.paymentMethod;
    transaction.status = input.status;

    return await repo.save(transaction);
  }

  async getOrganizationTransaction(transactionId: string) {
    try {
      return await this.datasource
        .getRepository(OrganizationTransaction)
        .createQueryBuilder('ot')
        .where('ot.transaction_id = :transactionId', { transactionId })
        .andWhere('ot.status  = : status ', {
          status: OrgTransactionStatus.Success,
        })
        .getOne();
    } catch (err) {
      throw err;
    }
  }

  async getUserTransaction(transactionId: string) {
    try {
      return await this.datasource
        .getRepository(StudentTransaction)
        .createQueryBuilder('st')
        .where('st.transaction_id = :transactionId', { transactionId })
        .andWhere('st.status  = : status ', {
          status: StudentTransactionStatus.Success,
        })
        .getOne();
    } catch (err) {
      throw err;
    }
  }

  async markOrganizationOrderAsFailed(input: {
    gatewayOrderId: string;
    status: OrgTransactionStatus;
    failureReason: OrgTransactionFailureReason;
  }) {
    const repo = this.datasource.getRepository(OrganizationTransaction);
    const transaction = await repo.findOne({
      where: { gateway_order_id: input.gatewayOrderId },
    });

    if (!transaction) return null;

    transaction.status = input.status;
    transaction.failure_reason = input.failureReason;

    return await repo.save(transaction);
  }

  async markStudentOrderAsFailed(input: {
    gatewayOrderId: string;
    status: StudentTransactionStatus;
    failureReason: StudentTransactionFailureReason;
  }) {
    const repo = this.datasource.getRepository(StudentTransaction);
    const transaction = await repo.findOne({
      where: { gateway_order_id: input.gatewayOrderId },
    });

    if (!transaction) return null;

    transaction.status = input.status;
    transaction.failure_reason = input.failureReason;

    return await repo.save(transaction);
  }

  async getAllPlatformTransactions() {
    try {
      return await this.datasource
        .getRepository(OrganizationTransaction)
        .createQueryBuilder('ot')
        .orderBy('ot.created_at', 'DESC')
        .getMany();
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to fetch platform transactions',
      );
    }
  }

  async getPlatformTransactionsByOrgId(
    orgId: string,
  ): Promise<OrganizationTransaction[]> {
    try {
      return await this.datasource
        .getRepository(OrganizationTransaction)
        .createQueryBuilder('ot')
        .where('ot.organization_id = :orgId', { orgId })
        .orderBy('ot.created_at', 'DESC')
        .getMany();
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to fetch organization platform transactions',
      );
    }
  }

  async getSinglePlatformTransaction(orgId: string, transactionId: string) {
    try {
      return await this.datasource
        .getRepository(OrganizationTransaction)
        .createQueryBuilder('ot')
        .where('ot.organization_id = :orgId', { orgId })
        .andWhere('ot.transaction_id = :transactionId', { transactionId })
        .getOne();
    } catch (err) {
      throw err;
    }
  }

  // --- Student Transactions (Database Queries Only) ---

  async findStudentTransactionsByOrgId(
    orgId: string,
  ): Promise<StudentTransaction[]> {
    return await this.datasource
      .getRepository(StudentTransaction)
      .createQueryBuilder('st')
      .where('st.organization_id = :orgId', { orgId })
      .orderBy('st.created_at', 'DESC')
      .getMany();
  }

  async findStudentTransactionsByUserId(
    orgId: string,
    userId: string,
  ): Promise<StudentTransaction[]> {
    return await this.datasource
      .getRepository(StudentTransaction)
      .createQueryBuilder('st')
      .where('st.organization_id = :orgId', { orgId })
      .andWhere('st.user_id = :userId', { userId })
      .orderBy('st.created_at', 'DESC')
      .getMany();
  }

  async findSingleStudentTransaction(
    orgId: string,
    userId: string,
    transactionId: string,
  ): Promise<StudentTransaction | null> {
    return await this.datasource
      .getRepository(StudentTransaction)
      .createQueryBuilder('st')
      .where('st.organization_id = :orgId', { orgId })
      .andWhere('st.user_id = :userId', { userId })
      .andWhere('st.transaction_id = :transactionId', { transactionId })
      .getOne();
  }
}
