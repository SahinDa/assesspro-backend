import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { UserRole } from "src/config/enum";
import { IS_PUBLIC_KEY } from "src/decorators/public.decorator";
import { ROLES_KEY } from "src/decorators/role.decorator";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
    ) { }
    async canActivate(context: ExecutionContext): Promise<boolean> {

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are specified on the route, allow access by default
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }


        // 2. Read the user object attached previously by the AuthGuard
        const { user } = context.switchToHttp().getRequest();
       if (!user || user.role === undefined || user.role === null){
            throw new ForbiddenException('User context or role missing');
        }

        // 3. Check if user's role matches any allowed roles

        const hasPermission = requiredRoles.includes(user.role);
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        return true;
    }

}