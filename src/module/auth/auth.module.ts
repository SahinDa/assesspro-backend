import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Auth } from "./entities/auth.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { UserModule } from "../users/user.module";

@Module({
 imports:[
 TypeOrmModule.forFeature([Auth]),
 forwardRef(() =>UserModule),
],
 controllers:[AuthController],
 providers:[AuthService,AuthRepository],
 exports:[AuthService,AuthRepository]
})
export class AuthModule {}