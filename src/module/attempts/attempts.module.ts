import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttemptAnswer } from "./entities/attemptanswer.entity";
import { TestAttempt } from "./entities/testattempt.entity";
import { AttemptsController } from "./attempts.controller";
import { AttemptsService } from "./attempts.service";
import { AttemptsRepository } from "./attempts.repository";

@Module({
    imports:[TypeOrmModule.forFeature([AttemptAnswer,TestAttempt])],
    controllers:[AttemptsController],
    providers:[AttemptsService,AttemptsRepository],
    exports:[AttemptsService,AttemptsRepository]
})

export class AttemptsModule {}