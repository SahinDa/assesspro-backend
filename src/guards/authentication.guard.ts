import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "src/config/enum";
import { IS_PUBLIC_KEY } from "src/decorators/public.decorator";
import { OrganizationsService } from "src/module/organizations/organizations.service";
import { UsersService } from "src/module/users/users.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersservice: UsersService,
    private readonly organizationsservice : OrganizationsService ,
  ) { }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.cookies['accessToken'] || this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Access token missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.usersservice.findByEmail(payload.email);

      if (!user) {
        throw new UnauthorizedException('Invalid or expired access token');
      }

      if (user.status == 2) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (user.status == 0) {
        throw new ForbiddenException('Your account is on hold due to a pending review.');
      }

      if(user.role == UserRole.ORGANIZATION){
        const organization = await this.organizationsservice.findOrganizationDetailsByUserId(user.user_id);
        request.organization = organization;
      }
      request.user = user;
      return true;

    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}