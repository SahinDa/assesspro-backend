import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { DataSource, Repository } from "typeorm";
import { Auth } from "./entities/auth.entity";

@Injectable()
export class AuthRepository extends Repository<Auth> { 
  constructor(private dataSource: DataSource) {
    super(Auth, dataSource.createEntityManager());
  }

  /**
   * Explicitly defines a custom helper function to locate credentials
   * @param userId The UUID of the user
   */
  async findCredentialsByUserId(userId: string): Promise<Auth | null> {
    return this.findOne({
      where: { 
        user: { user_id: userId } 
      },
    });
  }

  async findCredentialsWithUserProfile(userId: string): Promise<Auth | null> {
    return this.findOne({
      where: { 
        user: { user_id: userId } 
      },
      relations: ['user'], //  Performs the SQL LEFT JOIN
    });
  }

  async saveUserAuthDatails(auth : Auth){
     return  this.save(auth);
  }

  async findByUserId(userId: string): Promise<Auth | null> {
    return await this.findOne({
      where: { user: { user_id: userId } }
    });
  }

  async updatePasswordHash(userId: string, hashedNewPassword: string): Promise<boolean> {
    const result = await this.update(
      { user: { user_id: userId } }, 
      { 
        password_hash: hashedNewPassword,
        refresh_token: null,
        updated_at: new Date()
      }
    );

  return typeof result?.affected === 'number' && result.affected > 0;
  }
}