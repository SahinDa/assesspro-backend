import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
export class createTestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Test name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Test name cannot exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9]+( [a-zA-Z0-9]+)*$/, {
    message:
      'Test name can only contain letters, numbers, and single spaces (no special characters)',
  })
  name: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;
}

export class updateTestDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(2, { message: 'Test name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Test name cannot exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9]+( [a-zA-Z0-9]+)*$/, {
    message:
      'Test name can only contain letters, numbers, and single spaces (no special characters)',
  })
  name?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;
}
