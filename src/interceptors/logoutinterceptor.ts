import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";
import { Response } from "express";

@Injectable()
export class LogoutInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const response = context.switchToHttp().getResponse<Response>();
        return next.handle().pipe(
            map((payload) => {

                response.clearCookie('accessToken', {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                });
                response.clearCookie('refreshToken', {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                });

                return payload;
            })
        )
    }
}