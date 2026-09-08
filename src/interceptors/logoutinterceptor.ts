import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";
import { Response } from "express";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
};

@Injectable()
export class LogoutInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const response = context.switchToHttp().getResponse<Response>();
        return next.handle().pipe(
            map((payload) => {
        response.clearCookie('accessToken', COOKIE_OPTIONS);
        response.clearCookie('refreshToken', COOKIE_OPTIONS);

                return payload;
            })
        )
    }
}
