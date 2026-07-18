import { BookmarkType } from 'src/config/enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('bookmarks')
@Index(['user_id', 'org_id'])
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  bookmark_id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  org_id: string;

  @Column('uuid')
  item_id: string; // Stores either set_id or test_id

  @Column({
    type: 'smallint',
    enum: BookmarkType,
  })
  item_type: BookmarkType;

  @CreateDateColumn()
  created_at: Date;
}
