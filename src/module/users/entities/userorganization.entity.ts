import { OrganizationRole } from "src/config/enum";
import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
    Index
} from "typeorm";
import { User } from "./user.entity";
import { Organization } from "src/module/organizations/entities/organization.entity";


@Entity("user_organization")
@Index(["user_id", "org_id"], { unique: true })
export class UserOrganization {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    user_id: string;

    @Column({ type: "uuid" })
    org_id: string;

    @Column({ type: "timestamptz" })
    joined_date: Date;

    @Column({ type: "enum", enum: OrganizationRole })
    role: OrganizationRole;

    @Column({ default: false })
    is_deleted: boolean;

    @ManyToOne(() => User, (user) => user.userOrganizations)
    @JoinColumn({ name: "user_id" })
    user: User;

    @ManyToOne(() => Organization, (org) => org.userOrganizations)
    @JoinColumn({ name: "org_id" })
    organization: Organization;
}