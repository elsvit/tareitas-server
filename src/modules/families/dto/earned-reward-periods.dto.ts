import { Type } from 'class-transformer';
import { IsArray } from 'class-validator';

export class PutEarnedRewardPeriodsDto {
  @IsArray()
  @Type(() => Object)
  periods!: unknown[];
}
