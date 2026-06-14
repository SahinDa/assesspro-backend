import { Injectable } from "@nestjs/common";
import { TestSetRepository } from "../repositories/testset.repository";

@Injectable()
export class TestSetService {
    constructor(private readonly testSetService :TestSetRepository){}
}