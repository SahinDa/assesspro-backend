import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserDTO {
  @IsOptional()
  @IsString()
  @Length(1, 100, {
    message: 'First name must be between 1 and 100 characters.',
  })
  @Matches(/^[a-zA-Z\s\-'\u00C0-\u017F]+$/, {
    message: 'First name contains invalid characters.',
  })
  firstname?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100, {
    message: 'Last name must be between 1 and 100 characters.',
  }) //  Fixed: Changed @@Length to @Length
  @Matches(/^[a-zA-Z\s\-'\u00C0-\u017F]+$/, {
    message: 'Last name contains invalid characters.',
  })
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
