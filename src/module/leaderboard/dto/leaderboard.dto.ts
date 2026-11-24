import { Type, Transform } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min, IsBoolean, IsString } from 'class-validator';

export class LeaderboardFilterDto {
  @IsOptional()
  @IsUUID()
  test_id?: string;

  @IsOptional()
  @IsUUID()
  testset_id?: string;

  @IsOptional()
  @IsUUID()
  orgId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}



export class GetAssessmentOptionsQueryDto {
  @IsOptional()
  @IsString()
  orgId?: string;

  @IsOptional()
  @IsString()
  test_id?: string;
  
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isTestset?: boolean = false;
}

export class GetLeaderboardSearchDto {
  @IsOptional()
  @IsUUID()
  orgId?: string;

  @IsOptional()
  @IsUUID()
  test_id?: string;

  @IsOptional()
  @IsUUID()
  testset_id?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'searchKeyword cannot be empty' })
  searchKeyword: string;
}
  
