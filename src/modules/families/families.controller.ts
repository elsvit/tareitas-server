import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload';

import { FamiliesService } from './families.service';

@Controller('families')
export class FamiliesController {
  constructor(
    private readonly familiesService: FamiliesService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyFamilies(@CurrentUser() user: JwtPayload) {
    return this.familiesService.getMyFamilies(user.sub);
  }
}