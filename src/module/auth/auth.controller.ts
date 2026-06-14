import { Body, Controller, Delete, HttpCode, HttpStatus, Patch, Post, Req, Res, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpDto } from "./dto/SignUpDTO.dto";
import { LoginDto } from "./dto/LogInDTO.dto";
import { LogoutInterceptor } from "src/interceptors/logoutinterceptor";
import { Public } from "src/decorators/public.decorator";
import { RoleGuard } from "src/guards/role.guard";
import { Roles } from "src/decorators/role.decorator";
import { UserRole } from "src/config/enum";

@Controller('auth')
@UseGuards(RoleGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async logIn(@Body() loginDto: LoginDto) {
    return this.authService.logIn(loginDto);
  }


  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() request: any) {
    const refreshToken = request.cookies['refreshToken'];
    return this.authService.refreshSession(refreshToken);
  }

  
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(LogoutInterceptor)
  async logout(
    @Req() request: any,
    @Res({ passthrough: true }) response: Response) {
    const accessToken = request.cookies['accessToken'];
    return this.authService.logout(accessToken);
  }

  @Delete('/:id/logout')
  @Roles(UserRole.ADMIN)
  async logoutByAdmin(){

  }


}
