import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

import { resolveRequestLang } from '../utils/resolve-request-lang';

@Injectable()
export class LangInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request =
      context.switchToHttp().getRequest<Request>();

    request.lang = resolveRequestLang(request);

    return next.handle();
  }
}
