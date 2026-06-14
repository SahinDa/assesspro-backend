import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse,ApiBody } from "@nestjs/swagger";
import { TestService } from "./services/test.service";
import { CreateTestDto } from "./dto/test.dto";
import { TestSetService } from "./services/testset.service";
import { QuestionService } from "./services/question.service";
import { Roles } from "src/decorators/role.decorator";
import { RoleGuard } from "src/guards/role.guard";
import { UserRole } from "src/config/enum";

@Controller('tests')
@UseGuards(RoleGuard)
@Roles(UserRole.ORGANIZATION, UserRole.ADMIN)
export class TestController {
    constructor(
      private readonly testService : TestService,
      private readonly testSetService : TestSetService,
      private readonly questionService : QuestionService,
    ){}
  
    //Test
  @Post()
  @ApiOperation({ summary: 'Create a new test' })
  @ApiResponse({ status: 201, description: 'The test has been successfully created.' })
  @ApiBody({ type: CreateTestDto })
   async create(@Body() body : CreateTestDto){
      return await this.testService.create(body);
   }  

   @Get('/count')
   async getAllTestCount(){

   }
   
   @Get('/list')
   async getAllTestList(){

   }

   @Get(':testId')
   async getTest(){

   }

   @Patch(':testId')
   async updateTest(){

   }

   @Delete(':testId')
   async deleteTest(@Param('testId') testId : string){

   }

   //Testset
   @Post('/testset')
   async createTestSet(){

   }
   @Get('/testset/count')
   async getAllTestSetCount(){

   }

   @Get('/testset/list')
   async getAllTestSetList(){

   }
   @Get('/testset/:testSetId')
   async getTestSet(){

   }
   @Patch('/testset/:testSetId')
   async updateTestSet(){

   }
   @Delete('/testset/:testSetId')
   async deleteTestSet(){

   }

   // Question
   @Post('/question')
   async createQuestion(){}

   @Put('/question')
   async updateQuestion(){}

   @Delete('/question')
   async deleteQuestion(){} //restrict now

   @Get('/question')
   async fetchQuestion(){} // not need as question will be fetch based on testset

}