import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Auth } from '../auth/entities/auth.entity';
import { UserStatus } from 'src/config/enum';
import { UserDTO } from './dto/user.dto';
import { UserOrganization } from './entities/userorganization.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async findByEmail(email: string) {
    return await this.repo.findOne({
      where: {
        email,
        is_deleted: false,
      },
      select: [
        'user_id',
        'firstname',
        'lastname',
        'email',
        'oauth_provider',
        'oauth_id',
        'email_verified',
        'role',
        'status',
        'profile_pic',
        'created_at',
        'updated_at',
      ],
      // relations: ['auth', 'userOrganizations']
    });
  }

  async createWithAuth(userData: Partial<User>, passwordHash: string) {
    return await this.dataSource.transaction(async (manager) => {
      // A. Save the Profile to the 'users' table
      const user = manager.create(User, userData);
      const savedUser = await manager.save(user);

      // B. Save the Credentials to the 'auth' table
      const auth = manager.create(Auth, {
        user: savedUser, // TypeORM links the user_id automatically here
        password_hash: passwordHash,
      });
      await manager.save(auth);

      return savedUser;
    });
  }

  async registerAsUser(userId: string, roleId: number): Promise<User> {
    await this.repo.update({ user_id: userId }, { role: roleId });

    const updatedUser = await this.findByEmailById(userId);
    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    return updatedUser;
  }

  async findByEmailById(userId: string) {
    return await this.repo.findOne({
      where: { user_id: userId, is_deleted: false },
      select: [
        'user_id',
        'firstname',
        'lastname',
        'email',
        'oauth_provider',
        'oauth_id',
        'email_verified',
        'role',
        'status',
        'profile_pic',
        'created_at',
        'updated_at',
      ],
    });
  }

  async deActivateAccount(
    userId: string,
    status: number,
  ): Promise<{ success: boolean }> {
    const result = await this.repo.update(
      { user_id: userId },
      {
        status: status,
        is_deleted: true,
      },
    );

    if (result.affected === 0) {
      throw new NotFoundException(
        'User account not found or already deactivated',
      );
    }

    return { success: true };
  }

  async deletedAccount(user_id: string) {
    try {
      const result = await this.dataSource
        .getRepository(User)
        .update({ user_id: user_id }, { status: UserStatus.DELETED });
      return (result?.affected ?? 0) > 0;
    } catch (err) {
      throw err;
    }
  }

  async removeAvatar(userId: string) {
    try {
      const result = await this.dataSource
        .getRepository(User)
        .update({ user_id: userId }, { profile_pic: null });
      return (result?.affected ?? 0) > 0;
    } catch (err) {
      throw err;
    }
  }

  async updateProfile(userId: string, input: UserDTO): Promise<boolean> {
    try {
      const updatePayload: Partial<User> = {};
      if (input.firstname !== undefined)
        updatePayload.firstname = input.firstname;
      if (input.lastname !== undefined) updatePayload.lastname = input.lastname;

      const result = await this.dataSource
        .getRepository(User)
        .update({ user_id: userId }, updatePayload);

      return (result?.affected ?? 0) > 0;
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to update user profile in database.',
      );
    }
  }
  async getMyOrganizations(userId: string): Promise<UserOrganization[]> {
    return await this.dataSource
      .getRepository(UserOrganization)
      .createQueryBuilder('uo')
      .innerJoinAndSelect('uo.organization', 'org')
      .where('uo.user_id = :userId', { userId })
      .andWhere('uo.is_deleted = false')
      .getMany();
  }
}
