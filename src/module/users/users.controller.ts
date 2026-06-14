import { Body, Controller, Delete, Get, Patch, Put, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { UsersService } from "./users.service";
import { RoleGuard } from "src/guards/role.guard";
import { UserRole } from "src/config/enum";
import { Roles } from "src/decorators/role.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { User } from "src/decorators/user.decorator";
import { JoinOrganizationDto, UpdatePasswordDto, UserDTO } from "./dto/user.dto";
import { IAuthenticatedUser } from "src/interfaces/user.interfaces";

@Controller('users')
export class UsersController {
constructor(private readonly userService : UsersService){}

  @Get(':userid/organizations')
 async getUserOrganizations(){}

 @Patch('join-organization')
 @UseGuards(RoleGuard)
 @Roles(UserRole.STUDENT)
 async joinOrganization(@User() user:IAuthenticatedUser,@Body() input: JoinOrganizationDto ){
    return this.userService.joinOrganization(user.user_id,input);
 }
  //user
  //After user registration every get two option to join this platform
  // 1. join as user 
  // 2. join as organization 
  //this api will call when someone choose to join as user
  @Patch('/register-as-user')
   @UseGuards(RoleGuard)
   @Roles(UserRole.OTHER)
  async registerAsUser(@User() user : IAuthenticatedUser){
    return this.userService.registerAsUser(user);
  }

  @Patch('/made-admin')
  @UseGuards(RoleGuard)
   @Roles(UserRole.OTHER)
   async madeAdmin(@User() user:IAuthenticatedUser ){
    return this.userService.madeAdmin(user);
   }

  @Get('/me')
  async getUserById(@User() user : IAuthenticatedUser){
    return this.userService.findByEmail(user.email);
  }

  @Get('/me/organizations')
  async getMyOrganizations(){}

  @Patch('/change-password')
  async updatePassword(@User() user : IAuthenticatedUser,@Body()updatePassword : UpdatePasswordDto){
    return this.userService.updatePassword(user.user_id,updatePassword);
  }

  @Delete('/me')
  async deActivateAccount(@User() user : IAuthenticatedUser){
     return this.userService.deActivateAccount(user.user_id);
  }

  @Put('/profile')
  async updateProfile(
    @User() user : IAuthenticatedUser,
    @Body() input : UserDTO){

  }
  
  @Patch('/profile/avatar')
  @UseInterceptors(FileInterceptor('file')) 
  async updateAvatar(
    @Req() req: any,
   // @UploadedFile() file: Express.Multer.File
  ) {}
 
  @Delete('/profile/avatar')
  async deleteAvatar(){}

    @Get('/list')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ORGANIZATION,UserRole.ADMIN)
  async getAllUsers(){
  }

  @Get(':userid')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN,UserRole.ORGANIZATION)
  async getUsers(){}


  @Patch('/status/:userid')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN,UserRole.ORGANIZATION)
  async updateUserStatus(){}


}