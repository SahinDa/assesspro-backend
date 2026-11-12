import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';
import { OrgUserSearchType } from  'src/config/enum';

export class SearchOrgUsersQueryDto {
  @IsString()
  @MinLength(1)
  query: string;

  @Type(() => Number)
  @IsEnum(OrgUserSearchType)
  type: OrgUserSearchType;

  @IsOptional()
  @IsUUID()
  orgId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
