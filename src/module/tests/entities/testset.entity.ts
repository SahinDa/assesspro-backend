import { Test } from "./test.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Question } from "./question.entity";
import { IsBoolean, IsEnum } from "class-validator";
import { NegativeMarkingOption } from "src/config/enum";

// each version/set of a test
@Entity('test_set')
export class TestSet {
    @PrimaryGeneratedColumn('uuid')
    set_id: string;

    @ManyToOne(() => Test, (test) => test.sets)
    test: Test;

    @Column({ type: 'uuid' })
    test_id: string;

    @Column({ type: 'smallint' })
    set_number: number; // 1, 2, 3…

    @Column({ type: 'smallint' })
    timer_minutes: number;

    @IsBoolean()
    is_negative_marking: boolean;

    @IsEnum(NegativeMarkingOption, {
        message: 'negative_score_value must be one of the allowed options: 0, 0.25, 0.50, or 1.00'
    })
    negative_score_value: NegativeMarkingOption;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz', nullable: true })
    updated_at?: Date;

    // Relations
    @OneToMany(() => Question, (question) => question.set)
    questions: Question[];
}