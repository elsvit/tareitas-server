import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import {
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';

import { AppModule } from './app.module';
import { AppException } from './common/errors/app.exception';
import { ErrorCode } from './common/errors/error-code';
import { flattenValidationErrors } from './common/errors/field-error';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );

  app.useStaticAssets(
    join(process.cwd(), 'uploads'),
    { prefix: '/uploads/' },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationErrors =>
        new AppException(
          ErrorCode.VALIDATION_ERROR,
          'Validation failed',
          HttpStatus.BAD_REQUEST,
          flattenValidationErrors(validationErrors),
        ),
    }),
  );

  await app.listen(3000);

  console.log(
    'Tareitas API running on http://localhost:3000',
  );
}

bootstrap();