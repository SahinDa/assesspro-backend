import { Injectable } from "@nestjs/common";
import { QuestionRepository } from "../repositories/question.repository";

@Injectable()
export class QuestionService{
    constructor(private readonly questionService :QuestionRepository){}
}