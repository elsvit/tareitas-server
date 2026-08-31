import {
  Controller,
  Get,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../db/prisma.service';

@Controller('api')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async health(@Res() res: Response) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return res.status(HttpStatus.OK).json({
        status: 'ok',
        database: 'connected',
      });
    } catch (error) {
      console.error('Health check database error:', error);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        database: 'disconnected',
      });
    }
  }
}