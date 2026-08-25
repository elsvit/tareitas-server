import {
  Controller,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import { FamilyMemberGuard } from '../../common/guards/family-member.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { UploadsService } from './uploads.service';
import { UploadedImageFile } from './uploads.types';

@Controller('families/:familyId/uploads')
@UseGuards(JwtAuthGuard, FamilyMemberGuard)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(
    @Param('familyId') familyId: string,
    @UploadedFile() file: UploadedImageFile,
    @Req() req: Request,
  ) {
    const saved =
      this.uploadsService.saveFamilyImage(
        familyId,
        file,
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
