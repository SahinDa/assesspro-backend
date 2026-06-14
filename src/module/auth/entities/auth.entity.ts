import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { User } from "../../users/entities/user.entity"

@Entity("auth")
export class Auth {
    @PrimaryGeneratedColumn("uuid")
    auth_id: string;

    @OneToOne(() => User, (user) => user.auth)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ length: 255 })
    password_hash: string;

    @Column({
        type: 'varchar',
        nullable: true
    })
    refresh_token?: string | null;

    @Column({ type: "timestamp with time zone", nullable: true })
    last_login?: Date;

    @Column({ type: "int", default: 0 })
    failed_attempts: number;

    @CreateDateColumn({ type: "timestamptz" })
    created_at: Date;

    @UpdateDateColumn({ type: "timestamptz", nullable: true })
    updated_at?: Date;

}