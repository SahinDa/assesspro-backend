import { Type } from 'class-transformer';
import { IsUUID, IsNotEmpty, IsEnum, IsArray, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { AnswerOption, SubmissionType, ViolationType } from 'src/config/enum';

export class StartAttemptDto {
    @IsUUID()
    @IsNotEmpty()
    test_id: string;

    @IsUUID()
    @IsNotEmpty()
    testset_id: string;
}


export class SingleAnswerDto {
    @IsUUID()
    question_id: string;

    @IsEnum(AnswerOption)
    selected_option: AnswerOption; // 1=A, 2=B, 3=C, 4=D, 0=Skipped
}

export class SubmitTestDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SingleAnswerDto)
    answers: SingleAnswerDto[];
}


export class SaveProgressBulkDto {
  @IsArray()
  @ValidateNested({each: true })
  @Type(() => SingleAnswerDto)
  answers: SingleAnswerDto[]; // 🚀 Cleanly validates the array
}

export class FinalSubmitDto {
  @IsEnum(SubmissionType)
  @IsOptional()
  @IsNumber()
  submitted_via?: SubmissionType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleAnswerDto)
  answers?: SingleAnswerDto[]; // The last 1-59 seconds of answers
}

export class ReportViolationDto {
  @IsEnum(ViolationType)
  @IsNotEmpty()
  violation_type: ViolationType;

   @IsUUID()
    @IsNotEmpty()
    orgId : string;
}