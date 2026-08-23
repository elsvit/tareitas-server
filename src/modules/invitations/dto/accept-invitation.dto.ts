import { Type } from 'class-transformer';
import {
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { ParentProfileInputDto } from '../../parent-profiles/dto/parent-profile-input.dto';

export class AcceptInvitationDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ParentProfileInputDto)
  parentProfile?: ParentProfileInputDto;
}
