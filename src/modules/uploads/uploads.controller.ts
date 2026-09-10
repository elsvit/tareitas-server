import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { FamilyMemberGuard } from '../../common/guards/family-member.guard';
import { ERole } from '../../types/user';
import { EFamilyImageKind } from '../../types/family-image';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload';

import {
  ConfirmUploadDto,
  DeleteFamilyImageDto,
  PresignUploadDto,
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

  @Get('access-url')
  getAccessUrl(
    @Param('familyId') familyId: string,
    @Query('path') path: string,
    @Req() req: Request,
  ) {
    return this.uploadsService
      .getMediaAccessUrl(familyId, path)
      .then(result => {
        if (result.legacy) {
          const host =
            req.get('host') ?? 'localhost:3000';
          const protocol = req.protocol;

          return {
            url: `${protocol}://${host}${result.url}`,
            expiresIn: result.expiresIn,
          };
        }

        return {
          url: result.url,
          expiresIn: result.expiresIn,
        };
      });
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

  @Post('presign')
  async presignUpload(
    @Param('familyId') familyId: string,
    @Body() dto: PresignUploadDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!this.uploadsService.isObjectStorageEnabled()) {
      res.status(HttpStatus.NOT_IMPLEMENTED);

      return {
        errorCode: 'PRESIGN_NOT_AVAILABLE',
        errorMessage: 'Object storage is not configured',
      };
    }

    return this.uploadsService.createPresignedUpload(
      familyId,
      dto.kind as EFamilyImageKind,
      dto.contentType,
      dto.contentLength,
    );
  }

  @Post('confirm')
  confirmUpload(
    @Param('familyId') familyId: string,
    @Body() dto: ConfirmUploadDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.confirmObjectStorageUpload(
      familyId,
      dto.path,
      dto.kind as EFamilyImageKind,
      user.sub,
    );
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
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

    return saved.then(async (result) => {
      const url =
        (await this.uploadsService.resolveMediaUrl(
          result.path,
        )) ??
        (() => {
          const host =
            req.get('host') ?? 'localhost:3000';
          const protocol = req.protocol;

          return `${protocol}://${host}${result.path}`;
        })();

      return {
        path: result.path,
        url,
      };
    });
  }
}
