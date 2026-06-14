import { CorrectAnswer, QuestionSource } from "src/config/enum";
import { Test } from "./test.entity";
import { TestSet } from "./testset.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


// actual questions
@Entity('question')
export class Question {
    @PrimaryGeneratedColumn('uuid')
    question_id: string;

    @ManyToOne(() => TestSet, (set) => set.questions)
    set: TestSet;

    @Column({ type: 'uuid' })
    set_id: string;

    @Column('text')
    question_text: string;

    @Column({ length: 255 })
    option_a: string;

    @Column({ length: 255 })
    option_b: string;

    @Column({ length: 255 })
    option_c: string;

    @Column({ length: 255 })
    option_d: string;

    @Column({ type: 'smallint', enum:CorrectAnswer})
    correct_answer: CorrectAnswer

    @Column({ type: 'enum', enum: QuestionSource, default: QuestionSource.MANUAL })
    source: QuestionSource;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz', nullable: true })
    updated_at?: Date;
}