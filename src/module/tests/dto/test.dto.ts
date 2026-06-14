import { IsString, IsNotEmpty, MinLength } from 'class-validator';
export class CreateTestDto{
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name:string;
}