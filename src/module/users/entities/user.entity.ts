import { AuthProvider, UserRole, UserStatus } from 'src/config/enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserOrganization } from './userorganization.entity';
import { Auth } from 'src/module/auth/entities/auth.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') // UUID primary key
  user_id: string;

  @Column({ length: 100 })
  firstname: string;

  @Column({ length: 100, nullable: true })
  lastname?: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ type: 'enum', enum: AuthProvider })
  oauth_provider?: AuthProvider;

  @Column({ nullable: true })
  oauth_id?: string;

  @Column({ default: false })
  email_verified?: boolean;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'smallint', default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profile_pic?: string | null;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updated_at?: Date;

  @OneToMany(() => UserOrganization, (userOrg) => userOrg.user)
  userOrganizations: UserOrganization[];

  @OneToOne(() => Auth, (auth) => auth.user)
  auth: Auth;
}
