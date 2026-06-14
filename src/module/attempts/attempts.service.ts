import { Injectable } from "@nestjs/common";
import { AttemptsRepository } from "./attempts.repository";

@Injectable()
export class AttemptsService{
    constructor(private readonly attemptsrepository : AttemptsRepository){}
}