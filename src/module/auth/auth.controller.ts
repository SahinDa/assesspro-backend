import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/SignUpDTO.dto';
import { LoginDto } from './dto/LogInDTO.dto';
import { LogoutInterceptor } from 'src/interceptors/logoutinterceptor';
import { Public } from 'src/decorators/public.decorator';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UserRole } from 'src/config/enum';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/PasswordDTO.dto';

@Controller('auth')
@UseGuards(RoleGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
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
    @Res({ passthrough: true }) response: Response,
  ) {
    const accessToken = request.cookies['accessToken'];
    return this.authService.logout(accessToken);
  }

  // 1. Endpoint to request the OTP (User submits their email)
  //POST /auth/forgot-password
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() input: ForgotPasswordDto) {
    return this.authService.forgotPassword(input);
  }

  // 2. Endpoint to verify OTP and update the password (User submits email, OTP, and new password)
  // POST /auth/reset-password-otp
  @Public()
  @Post('reset-password')
  async resetPassword(@Body() input: ResetPasswordDto) {
    return this.authService.resetPassword(input);
  }

  @Delete('/:id/logout')
  @Roles(UserRole.ADMIN)
  async logoutByAdmin() {}
}
