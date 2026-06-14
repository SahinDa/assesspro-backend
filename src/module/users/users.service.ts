import { BadRequestException, ConflictException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { UserDataDto } from "../auth/dto/SignUpDTO.dto";
import { UserRole, UserStatus } from "src/config/enum";
import * as bcrypt from 'bcrypt';
import { AuthRepository } from "../auth/auth.repository";
import { JoinOrganizationDto, UpdatePasswordDto } from "./dto/user.dto";
import { IAuthenticatedUser } from "src/interfaces/user.interfaces";
import { OrganizationsService } from "../organizations/organizations.service";

@Injectable()
export class UsersService{
    constructor(
      private readonly usersRepository :UsersRepository,
      private readonly authRepository : AuthRepository,
      @Inject(forwardRef(() => OrganizationsService))
    private readonly organizationsService: OrganizationsService,
    ){}
   async findByEmail(email:string){
       try{
          const user  = await this.usersRepository.findByEmail(email);
           if(!user){
             return null;
           }
          return user;
       }catch(err){
        throw err;
       }
   }
   async createWithAuth(body : UserDataDto,hash : string){
    try{
    return this.usersRepository.createWithAuth(body,hash)
    }catch(err){
        console.log("Fail to create user (createWithAuth)")
        throw err;
    }
   }
   async registerAsUser(user:IAuthenticatedUser){
    try{

      let currentRole = Number(user.role);
        if(currentRole !==  UserRole.OTHER){
           throw new ForbiddenException('You do not have permission to modify account status ');
        }

       const res = await this.usersRepository.registerAsUser(user.user_id,UserRole.STUDENT);
       return res;

    }catch(err){
      throw err;
    }
   }
    async madeAdmin(user:IAuthenticatedUser){
    try{

      let currentRole = Number(user.role);
        if(currentRole !==  UserRole.OTHER){
           throw new ForbiddenException('You do not have permission to modify account status ');
        }

       const res = await this.usersRepository.registerAsUser(user.user_id,UserRole.ADMIN);
       return res;

    }catch(err){
      throw err;
    }
   }
   async updatePassword(userId:any,updatePassword : UpdatePasswordDto){
      try{
        const { oldPassword, newPassword } = updatePassword;

    // 1. Fetch credentials directly via the AuthRepository
    const authRecord = await this.authRepository.findByUserId(userId);
    if (!authRecord) {
      throw new BadRequestException('Authentication profile not found.');
    }

    // 2. Compare the old password provided with the stored hash
    const isPasswordMatch = await bcrypt.compare(oldPassword, authRecord.password_hash);
    if (!isPasswordMatch) {
      throw new BadRequestException('The old password you entered is incorrect.');
    }

    // 3. Hash the brand-new password securely
     const salt = parseInt(process.env.JWT_SALT || '10');
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // 4. Execute the update query inside the AuthRepository
    const success = await this.authRepository.updatePasswordHash(userId, hashedNewPassword);
    
    if (!success) {
      throw new BadRequestException('Could not update password. Please try again.');
    }

    return { success: true, message: 'Password updated successfully' };
      }catch(err){
        throw err;
      }
   }
   async deActivateAccount(userid:string,){
     try{
       const res = await this.usersRepository.deActivateAccount(userid,UserStatus.DELETED);
       return res;
     }catch(err){
      throw err;
     }
   }
   async deletedAccount(user_id:string){
     try{
       const response = await this.usersRepository.deletedAccount(user_id);
       if(!response){
        throw new BadRequestException('Failed to terminate user account.');
       }
       return {
        message: "User deleted successfully"
       }
     }catch(err){
      throw err;
     }
   }
  async joinOrganization(userId: string, input: JoinOrganizationDto) {
    try {

      const isValid = await this.organizationsService.isValid(input.organizationId);
      if (!isValid) {
        throw new NotFoundException("The provided organization ID is invalid or inactive.");
      }

      const isAlreadyRequested = await this.organizationsService.checkExistingRequest(userId, input.organizationId);
      if (isAlreadyRequested) {
        throw new ConflictException("You have already submitted a join request to this organization.");
      }

      await this.organizationsService.enterJoinOrganizationRequest(userId, input.organizationId);

      return {
        success: true,
        message: "Your join request has been submitted successfully."
      };
    } catch (err) {
      throw err;
    }
  }
  async removeAvatar(userId : string){
    try{
        return await this.usersRepository.removeAvatar(userId);
    }catch(err){
      throw err;
    }
  }
}