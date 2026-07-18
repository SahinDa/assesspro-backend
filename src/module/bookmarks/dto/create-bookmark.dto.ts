import { IsUUID, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBookmarkDto {
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @IsInt()
  @IsNotEmpty()
  item_type: number;
}