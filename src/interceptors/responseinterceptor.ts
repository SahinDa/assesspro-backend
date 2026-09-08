import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((payload) => {
      const statusCode = response.statusCode; 
      let result = payload;

        if (payload && payload.accessToken) {
          const {accessToken,refreshToken,user,...otherdata} = payload;
          response.cookie('accessToken',accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 30 * 60 * 1000, // 30 mins
            path:'/',
          });
          if(refreshToken){
           response.cookie('refreshToken',refreshToken,{
              httpOnly:true,
              secure:true,
              sameSite:'lax',
              maxAge: 24 * 60 * 60 * 1000,
              path:'/',
           })
          }
          
          result = user ?? (Object.keys(otherdata).length ? otherdata : {});
        }

        return {
          error : false,
          statusCode: statusCode ?? 200,
          timestamp: new Date().toISOString(),
          data: result,
        };
      }),
    );
  }
}
