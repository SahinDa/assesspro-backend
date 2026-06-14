import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class UserDTO{

        @IsOptional()
        @IsString()
        @IsNotEmpty()
        @MaxLength(100)
        firstname?: string;

      @IsOptional()
        @IsString()
        @IsNotEmpty()
        @MaxLength(100)
        lastname?: string;
                            
}

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Old password is required' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(32, { message: 'New password cannot exceed 32 characters' })
  newPassword: string;
}

export class JoinOrganizationDto {

  @IsUUID()
  @IsNotEmpty({ message: 'organizationId is required.' })
  organizationId: string;

}