import { Test } from './test.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Question } from './question.entity';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { NegativeMarkingOption, TestSetStatus } from 'src/config/enum';

// each version/set of a test
@Entity('test_set')
export class TestSet {
  @PrimaryGeneratedColumn('uuid')
  set_id: string;

  @ManyToOne(() => Test, (test) => test.sets)
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @Column({ type: 'uuid' })
  test_id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(3, 255)
  name: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'smallint' })
  @IsInt()
  @Min(1)
  set_number: number; // 1, 2, 3…

  @Column({ type: 'smallint' })
  @IsInt()
  @Min(10)
  @Max(100)
  total_questions: number;

  @Column({ type: 'smallint' })
  @IsInt()
  @Min(1)
  timer_minutes: number;

  @Column({ type: 'smallint', default: 1 })
  @IsInt()
  @Min(1)
  @Max(100)
  positive_marking_value: number;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  is_negative_marking: boolean;

  @Column({
    type: 'numeric',
    precision: 3,
    scale: 2,
    default: NegativeMarkingOption.ZERO,
  })
  @IsEnum(NegativeMarkingOption)
  negative_score_value: NegativeMarkingOption;

  @Column({ type: 'smallint', default: TestSetStatus.ACTIVE })
  status: TestSetStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updated_at?: Date;

  // Relations
  @OneToMany(() => Question, (question) => question.set)
  questions: Question[];
}
