import { OrganizationStatus } from 'src/config/enum';
import { UserOrganization } from 'src/module/users/entities/userorganization.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150, unique: true })
  name: string;

  // numeric status: 0 = OnHold, 1 = Active, 2 = Deleted
  @Column({ type: 'smallint', default: OrganizationStatus.ACTIVE })
  status: OrganizationStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updated_at?: Date;

  @OneToMany(() => UserOrganization, (userOrg) => userOrg.organization)
  userOrganizations: UserOrganization[];
}
