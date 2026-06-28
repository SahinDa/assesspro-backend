import { CorrectAnswer, QuestionSource } from 'src/config/enum';
import { Test } from './test.entity';
import { TestSet } from './testset.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEnum, IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

// actual questions
@Entity('question')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  question_id: string;

  @ManyToOne(() => TestSet, (set) => set.questions)
  @JoinColumn({ name: 'set_id' })
  set: TestSet;

  @Column({ type: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  set_id: string;

  @Column('text')
  @IsString()
  @IsNotEmpty()
  @Length(10, 1000, {
    message: 'Question text must be between 10 and 1000 characters.',
  })
  question_text: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255, { message: 'Option A cannot exceed 255 characters.' })
  option_a: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255, { message: 'Option B cannot exceed 255 characters.' })
  option_b: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255, { message: 'Option C cannot exceed 255 characters.' })
  option_c: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255, { message: 'Option D cannot exceed 255 characters.' })
  option_d: string;

  @Column({ type: 'enum', enum: CorrectAnswer })
  @IsEnum(CorrectAnswer)
  correct_answer: CorrectAnswer;

  @Column({
    type: 'enum',
    enum: QuestionSource,
    default: QuestionSource.MANUAL,
  })
  @IsEnum(QuestionSource)
  source: QuestionSource;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updated_at?: Date;
}
