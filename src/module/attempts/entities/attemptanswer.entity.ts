import { AnswerOption } from "src/config/enum";
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";


@Entity("attempt_answers")
@Index(["attempt_id"])  // fetch all answers for an attempt quickly
export class AttemptAnswer {

  @PrimaryGeneratedColumn("uuid")
  answer_id: string;

  @Column("uuid")
  attempt_id: string;     // reference to TestAttempt

  @Column("uuid")
  question_id: string;    // which question was attempted

  @Column({ type: "smallint" })
  selected_option: AnswerOption; // 1=A, 2=B, 3=C, 4=D

  @Column({ type: "boolean" })
  is_correct: boolean;    // true if answer is correct
}