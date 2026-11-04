import { Type, Transform } from 'class-transformer';
import { BookmarkType } from 'src/config/enum';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  IsEnum,
} from 'class-validator';

export class GetBookmarksQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsBoolean()
  isOrgBookmark: boolean = false; // Fetch institute-pinned bookmarks

  @IsOptional()
  @IsUUID('4')
  orgId?: string; // Target organization ID

  @IsOptional()
  @Type(() => Number)
  @IsEnum(BookmarkType)
  itemType?: BookmarkType;
}
