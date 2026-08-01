import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AuthProvider, UserRole, UserStatus } from 'src/config/enum';

export class InputData {
  @IsString()
  @IsNotEmpty({ message: 'First name cannot be empty or whitespace.' })
  @Length(1, 100, {
    message: 'First name must be between 1 and 100 characters.',
  })
  @Matches(/^[a-zA-Z\s\-'\u00C0-\u017F]+$/, {
    message: 'First name contains invalid characters.',
  })
  firstname: string;

  @IsString()
  @IsOptional()
  @Length(1, 100, {
    message: 'Last name must be between 1 and 100 characters.',
  })
  @Matches(/^[a-zA-Z\s\-'\u00C0-\u017F]+$/, {
    message: 'Last name contains invalid characters.',
  })
  lastname?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
export class UserDataDto extends InputData {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsBoolean()
  @IsOptional()
  is_deleted?: boolean;

  @IsEnum(AuthProvider)
  @IsOptional()
  oauth_provider?: AuthProvider;
}

export class SignUpDto extends InputData {
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password is too short (min 8 characters)' })
  @MaxLength(32, { message: 'New password cannot exceed 32 characters' })
  password: string;
}
