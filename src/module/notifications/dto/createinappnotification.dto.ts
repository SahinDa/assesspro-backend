import {
  IsUUID,
  IsString,
  IsOptional,
  IsNotEmpty,
  Length,
  IsBoolean,
} from 'class-validator';

export class CreateInAppNotificationDto {
  // Marked optional because it will be null for global broadcasts
  @IsUUID()
  @IsOptional()
  userId?: string | null;

  @IsUUID()
  @IsOptional()
  orgId?: string | null;

  @IsBoolean()
  @IsOptional()
  is_global?: boolean = false;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  url?: string;

  // Added this to allow the service to decide if it's pinned
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean = false;
}
