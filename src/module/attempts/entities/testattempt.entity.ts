import { SubmissionType } from 'src/config/enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('test_attempts')
@Index(['user_id']) // fast queries by student
@Index(['test_id']) // fast queries for leaderboard
export class TestAttempt {
  @PrimaryGeneratedColumn('uuid')
  attempt_id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  test_id: string;

  @Column('uuid')
  set_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  start_time: Date; // start time of attempt

  @Column({ type: 'timestamptz' })
  end_time: Date; // end time, always present

  @Column({
    type: 'numeric',
    precision: 6, // Allows total digits up to 9999.99
    scale: 2, // Saves exactly 2 digits after the decimal point
    default: 0.0,
  })
  score: number; // final score

  @Column({ type: 'smallint', default: 0 })
  violation_score: number;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  last_away_at: Date | null;

  @Column({ type: 'int', default: 1 })
  attempt_number: number; // retry count if any

  @Column({
    type: 'smallint',
    nullable: true,
    default: null,
  })
  submitted_via: SubmissionType | null;
}
