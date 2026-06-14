import { IsNotEmpty, IsString, MaxLength, MinLength , IsUUID, IsEnum  } from "class-validator";
import { OrganizationStatus } from 'src/config/enum';
import { JoinRequestStatus } from 'src/config/enum';
export class OrganizationInputDTO {
    @IsString()
    @IsNotEmpty()
    @MinLength(3, { message: 'Orgaization name must be at least 3 characters long' })
    @MaxLength(32, { message: 'Orgaization name cannot exceed 32 characters' })
    name:string;
}


export class UpdateOrgStatusDto {
  @IsUUID()
  orgId: string;

  @IsEnum(OrganizationStatus)
  status: OrganizationStatus;
}


export class HandleJoinRequestDto {
  @IsEnum(JoinRequestStatus, {
    message: 'Action must be 1 (REJECTED) or 2 (APPROVED)'
  })
  action: JoinRequestStatus;
}