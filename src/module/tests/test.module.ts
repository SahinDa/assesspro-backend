import { Module } from "@nestjs/common";
import { TestController } from "./test.controller";
import { TestService } from "./services/test.service";
import { TestSetService } from "./services/testset.service";
import { QuestionService } from "./services/question.service";
import { TestRepository } from "./repositories/test.repository";
import { TestSetRepository } from "./repositories/testset.repository";
import { QuestionRepository } from "./repositories/question.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Question } from "./entities/question.entity";
import { Test } from "./entities/test.entity";
import { TestSet } from "./entities/testset.entity";

@Module({
    imports:[TypeOrmModule.forFeature([Question,Test,TestSet])],
    controllers:[TestController],
    providers:[
        TestService,
        TestSetService,
        QuestionService,
        TestRepository,
        TestSetRepository,
        QuestionRepository,
    ],
    exports:[
        TestService,
        TestSetService,
        QuestionService,
    ]
})
export class TestModule {}