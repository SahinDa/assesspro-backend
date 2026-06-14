import { Injectable } from "@nestjs/common";
import { CreateTestDto } from "../dto/test.dto";
import { TestRepository } from "../repositories/test.repository";

@Injectable()
export class TestService{
    constructor(private readonly testRepository : TestRepository){}
    
    async create(input : CreateTestDto){
        try{
        //todo 
        // validate name is already exist for this organization or not
        // if not then create 
        }catch(err){

        }
    }
}