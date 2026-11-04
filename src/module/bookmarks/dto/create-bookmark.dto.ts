import { IsUUID, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import {  BookmarkTarget } from 'src/config/enum';

export class CreateBookmarkDto {
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @IsInt()
  @IsNotEmpty()
  item_type: number;

  @IsEnum(BookmarkTarget)
  @IsOptional()
  target_type?: BookmarkTarget = BookmarkTarget.ORGANIZATION;
}
