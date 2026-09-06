import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RevenueCatWebhookGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedAuthorization =
      this.configService.get<string>(
        'REVENUECAT_WEBHOOK_AUTHORIZATION',
      );

    if (!expectedAuthorization) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request>();
    const authorization = request.headers.authorization;

    if (authorization !== expectedAuthorization) {
      throw new UnauthorizedException(
        'Invalid RevenueCat webhook authorization',
      );
    }

    return true;
  }
}
