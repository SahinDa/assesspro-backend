import { IsString, IsOptional, IsInt, Min, Max, IsBoolean, IsEnum, ValidateNested, IsArray, IsNotEmpty, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { CorrectAnswer, NegativeMarkingOption } from 'src/config/enum';

export class CreateQuestionNestedDto {
    @IsString({ message: 'Question text must be a valid string.' })
    @IsNotEmpty({ message: 'Question text cannot be blank.' })
    @Length(10, 1000, { message: 'Question text must be between 10 and 1000 characters long.' })
    question_text: string;

    @IsString({ message: 'Option A must be a valid string.' })
    @IsNotEmpty({ message: 'Option A cannot be blank.' })
    @Length(1, 250, { message: 'Option A cannot exceed 250 characters.' })
    option_a: string;

    @IsString({ message: 'Option B must be a valid string.' })
    @IsNotEmpty({ message: 'Option B cannot be blank.' })
    @Length(1, 250, { message: 'Option B cannot exceed 250 characters.' })
    option_b: string;

    @IsString({ message: 'Option C must be a valid string.' })
    @IsNotEmpty({ message: 'Option C cannot be blank.' })
    @Length(1, 250, { message: 'Option C cannot exceed 250 characters.' })
    option_c: string;

    @IsString({ message: 'Option D must be a valid string.' })
    @IsNotEmpty({ message: 'Option D cannot be blank.' })
    @Length(1, 250, { message: 'Option D cannot exceed 250 characters.' })
    option_d: string;

    @IsEnum(CorrectAnswer, { message: 'Correct answer must be one of the valid options: a, b, c, or d.' })
    correct_answer: CorrectAnswer;
}

export class CreateTestSetDto {
    @IsString({ message: 'Test set name must be a valid string.' })
    @IsNotEmpty({ message: 'Test set name is required and cannot be empty.' })
    @Length(3, 255, { message: 'Test set name must be between 3 and 255 characters.' })
    name: string;

    @IsOptional()
    @IsString({ message: 'Description must be a valid string.' })
    @Length(0, 2000, { message: 'Description cannot exceed 2000 characters.' }) 
    description?: string;

    @IsInt({ message: 'Total questions count must be a whole number.' })
    @Min(10, { message: 'A test section must contain at least 10 questions.' })
    @Max(100, { message: 'A single test section cannot exceed a maximum of 100 questions.' })
    total_questions: number;

    @IsInt({ message: 'Timer minutes must be a whole number.' })
    @Min(1, { message: 'Timer duration must be at least 1 minute.' })
    timer_minutes: number;

    @IsInt({ message: 'Positive marking value must be a whole number.' })
    @Min(1, { message: 'Positive marks awarded must be at least 1.' })
    @Max(100, { message: 'Positive marks awarded cannot exceed 100.' })
    positive_marking_value: number;

    @IsBoolean({ message: 'Negative marking flag must be a boolean value (true or false).' })
    is_negative_marking: boolean;

    @IsEnum(NegativeMarkingOption, { message: 'Negative score value must be a valid option from your configuration enum.' })
    negative_score_value: NegativeMarkingOption;

    @IsArray({ message: 'Questions must be supplied as an array list.' })
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionNestedDto)
    questions: CreateQuestionNestedDto[]; 
}

export class UpdateTestSetDto {
    @IsOptional()
    @IsString({ message: 'Test set name must be a valid string.' })
    @Length(3, 255, { message: 'Test set name must be between 3 and 255 characters.' })
    name?: string;

    @IsOptional()
    @IsString({ message: 'Description must be a valid string.' })
    @Length(0, 2000, { message: 'The exam rules/description cannot exceed 2000 characters.' })
    description?: string;

    @IsOptional()
    @IsInt({ message: 'Total questions count must be a whole number.' })
    @Min(10, { message: 'A test section must contain at least 10 questions.' })
    @Max(100, { message: 'A single test section cannot exceed a maximum of 100 questions.' })
    total_questions?: number;

    @IsOptional()
    @IsInt({ message: 'Timer minutes must be a whole number.' })
    @Min(1, { message: 'Timer duration must be at least 1 minute.' })
    timer_minutes?: number;

    @IsOptional()
    @IsInt({ message: 'Positive marking value must be a whole number.' })
    @Min(1, { message: 'Positive marks awarded must be at least 1.' })
    @Max(100, { message: 'Positive marks awarded cannot exceed 100.' })
    positive_marking_value?: number;

    @IsOptional()
    @IsBoolean({ message: 'Negative marking flag must be a boolean value (true or false).' })
    is_negative_marking?: boolean;

    @IsOptional()
    @IsEnum(NegativeMarkingOption, { message: 'Negative score value must be a valid option from your configuration enum.' })
    negative_score_value?: NegativeMarkingOption;

    @IsOptional()
    @IsArray({ message: 'Questions must be supplied as an array list.' })
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionNestedDto) // Reuses the child validation rules we already wrote
    questions?: CreateQuestionNestedDto[]; 
}