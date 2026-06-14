import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { AuthProvider, UserRole, UserStatus } from "src/config/enum";

export class InputData {
    @IsString()
    @IsNotEmpty()
    firstname: string; 

    @IsString()
    @IsNotEmpty()
    lastname:string;

    @IsEmail() // Specifically validates the email format (e.g., name@domain.com)
    @IsNotEmpty()
    email: string;
}
export class UserDataDto extends InputData{

    @IsEnum(UserRole)
    @IsOptional() 
    role?: UserRole;

    @IsEnum(UserStatus)
    @IsOptional() 
    status?:UserStatus

    @IsBoolean()
    @IsOptional()
    is_deleted?:boolean;

    @IsEnum(AuthProvider)
    @IsOptional() 
    oauth_provider?:AuthProvider;
}

export class SignUpDto extends InputData {

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password is too short (min 8 characters)' })
    @MaxLength(32, { message: 'New password cannot exceed 32 characters' })
    password: string;
}