import { OwnerType, TestStatus } from "src/config/enum";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { TestSet } from "./testset.entity";
import { Question } from "./question.entity";

//the container/folder
@Entity('test')
export class Test {
    @PrimaryGeneratedColumn('uuid')
    test_id: string;

    @Column({ length: 100 })
    name: string;

    @Column({ type: "smallint" })
    owner_type: OwnerType; // Admin or Organization

    @Column({ type: "uuid" })
    owner_id: string; // UUID of admin or organization

    @Column({ type: "smallint", default: TestStatus.ACTIVE })
    status: TestStatus;

    @CreateDateColumn({ type: "timestamptz" })
    created_at: Date;

    @UpdateDateColumn({ type: "timestamptz", nullable: true })
    updated_at?: Date;

    // Relations
    @OneToMany(() => TestSet, (set) => set.test)
    sets: TestSet[];
}