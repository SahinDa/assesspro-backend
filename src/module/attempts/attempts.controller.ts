import { Controller, Get, Post } from "@nestjs/common";
import { AttemptsService } from "./attempts.service";

@Controller('attempts')
export class AttemptsController {
    constructor(private readonly attemptsservices : AttemptsService){}
 
    // STEP 1: Run this when the user clicks "Start Test"
    // This creates the attempt_id row and sets the locked end_time
    @Post('start')
    async startTest() {
    
    }

    //this endpoint take each question id and answer in body
    // do calculate and populate both attemptanswer and testattempt table
    // test score and etc
    @Post(':attemptId/submit')
    async submitTest(){
        
    }

    //details about one perticular attemps
    //return test id ,name , set id ,name , each question and option and you answer
    @Get()
    async getDetailsAboutAttempt(){}

    //return attempts history of one user 
    // return test id and name , set id and name and attempt number
    @Get('/history')
    async getAttemptHistory(){}
}
