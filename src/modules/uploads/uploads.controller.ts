import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { FamilyMemberGuard } from '../../common/guards/family-member.guard';
import { ERole } from '../../types/user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload';

import {
  DeleteFamilyImageDto,
  UploadFamilyImageDto,
} from './dto/family-image.dto';
import { UploadsService } from './uploads.service';
import { UploadedImageFile } from './uploads.types';

@Controller('families/:familyId/uploads')
@UseGuards(JwtAuthGuard, FamilyMemberGuard)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
  ) {}

  @Get('library')
  listLibrary(
    @Param('familyId') familyId: string,
  ) {
    return this.uploadsService.listFamilyImages(
      familyId,
    );
  }

  @Delete('library')
  @RequireRole(ERole.admin, ERole.parent)
  deleteFromLibrary(
    @Param('familyId') familyId: string,
    @Body() dto: DeleteFamilyImageDto,
  ) {
    return this.uploadsService.deleteFamilyImage(
      familyId,
      dto.path,
    );
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(
    @Param('familyId') familyId: string,
    @UploadedFile() file: UploadedImageFile,
    @Body() dto: UploadFamilyImageDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const saved =
      this.uploadsService.saveFamilyImage(
        familyId,
        file,
        user.sub,
        dto.kind,
      );

    return saved.then((result) => {
      const host =
        req.get('host') ?? 'localhost:3000';
      const protocol = req.protocol;

      return {
        path: result.path,
        url: `${protocol}://${host}${result.path}`,
      };
    });
  }
}
