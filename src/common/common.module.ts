import { Module } from '@nestjs/common';

import { FamilyMemberGuard } from './guards/family-member.guard';

@Module({
  providers: [FamilyMemberGuard],
  exports: [FamilyMemberGuard],
})
export class CommonModule {}
