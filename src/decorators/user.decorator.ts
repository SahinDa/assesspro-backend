import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return {
         user_id: user.user_id,
         firstname: user.firstname,
         lastname: user.lastname,
         email: user.email,
         oauth_provider: user.oauth_provider,
         oauth_id: user.oauth_id,
         email_verified: user.email_verified,
         role: user.role,
         status: user.status,
         profile_pic: user.profile_pic,
         created_at: user.created_at,
         updated_at: user.updated_at,
    }
  },
);