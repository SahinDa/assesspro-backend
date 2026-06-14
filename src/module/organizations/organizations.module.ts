import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Organization } from "./entities/organization.entity";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";
import { OrganizationsRepository } from "./organizations.repository";
import { UserModule } from "../users/user.module";
import { JoinRequest } from "./entities/join-request.entity";

@Module({
 imports:[
    TypeOrmModule.forFeature([Organization,JoinRequest]),
forwardRef(() => UserModule),
],
 controllers:[OrganizationsController],
 providers:[OrganizationsService,OrganizationsRepository],
 exports:[OrganizationsService,OrganizationsRepository]
})

export class OrganizationsModule {}