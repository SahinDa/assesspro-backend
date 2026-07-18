// src/attempt/entities/exam-violation-rule.entity.ts
import { ViolationType } from 'src/config/enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('exam_violation_rules')
export class ExamViolationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index({ unique: true }) // One profile row maximum per organization tenant
  org_id: string;

  @Column({ type: 'jsonb', nullable: true, default: null })
  violation_weights: Record<number, number | null> | null;

  @Column({ type: 'smallint', nullable: true, default: null })
  max_score_allowed: number | null;

  @Column({ type: 'smallint', nullable: true, default: null })
  time_interval_seconds: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
