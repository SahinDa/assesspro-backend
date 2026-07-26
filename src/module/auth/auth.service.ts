import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { SignUpDto, UserDataDto } from './dto/SignUpDTO.dto';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, UserRole, UserStatus } from 'src/config/enum';
import { LoginDto } from './dto/LogInDTO.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}
  async signUp(signUpDto: SignUpDto) {
    try {
      const { firstname, lastname, email, password } = signUpDto;
      const existing = await this.usersService.findByEmail(email);
      if (existing) {
        throw new ConflictException('Email already exists');
      }

      const salt = parseInt(process.env.JWT_SALT || '10');
      const hash = await bcrypt.hash(password, salt);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);

      const userData: UserDataDto = {
        firstname,
        lastname,
        email,
        role: UserRole.OTHER,
        status: UserStatus.PENDING,
        is_deleted: false,
        oauth_provider: AuthProvider.NO_AUTH_PROVIDER,
      };

      const newUser = await this.usersService.createWithAuth(
        userData,
        hash,
        otp,
        otp_expires_at,
      );

      await this.mailService.sendMail(
        email,
        'Verify Your Email - AssessPro',
        'otp',
        { name: firstname, otp },
      );

      return {
        success: true,
        message:
          'Registration successful! Please check your email for the verification OTP.',
        email: newUser.email,
      };
    } catch (err) {
      console.log('Fail to signup ');
      throw err;
    }
  }

  async verifyOtp(email: string, enteredOtp: string) {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.status === UserStatus.ACTIVE) {
        throw new BadRequestException('Account is already verified');
      }

      const auth = await this.authRepository.findCredentialsByUserId(
        user.user_id,
      );
      if (!auth || !auth.otp) {
        throw new BadRequestException('No active OTP found for this user');
      }

      if (String(auth.otp).trim() !== String(enteredOtp).trim()) {
        throw new BadRequestException('Invalid OTP code');
      }

      if (!auth.otp_expires_at || new Date() > new Date(auth.otp_expires_at)) {
        throw new BadRequestException(
          'OTP has expired. Please request a new one.',
        );
      }

      // Clear OTP fields
      auth.otp = null;
      auth.otp_expires_at = null;

      // Generate tokens now that they are verified
      const salt = parseInt(process.env.JWT_SALT || '10');
      const payload = { userid: user.user_id, email: user.email };
      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: '30m',
      });
      const refreshToken = await this.jwtService.signAsync(
        { userid: user.user_id },
        { expiresIn: '1d' },
      );

      auth.refresh_token = await bcrypt.hash(refreshToken, salt);
      auth.last_login = new Date();
      await this.authRepository.saveUserAuthDatails(auth);
      // Update user status to ACTIVE
      await this.usersService.updateUserStatus(
        user.user_id,
        UserStatus.ACTIVE,
        true,
      );
      const updateduser = await this.usersService.findByEmail(email);
      return {
        success: true,
        message: 'Email verified successfully!',
        updateduser,
        accessToken,
        refreshToken,
      };
    } catch (err) {
      throw err;
    }
  }

  async logIn(login: LoginDto) {
    try {
      const { email, password } = login;
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (user.status == 2) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (user.status == 0) {
        throw new ForbiddenException(
          'Your account is on hold due to a pending review.',
        );
      }

      const auth = await this.authRepository.findCredentialsByUserId(
        user.user_id,
      );
      if (!auth) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordMatch = await bcrypt.compare(
        password,
        auth.password_hash,
      );

      if (!isPasswordMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const payload = {
        userid: user.user_id,
        email: user.email,
        // role: user.role
      };

      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: '30m',
      });
      const refreshToken = await this.jwtService.signAsync(
        { userid: user.user_id },
        { expiresIn: '1d' },
      );

      const salt = parseInt(process.env.JWT_SALT || '10');
      auth.refresh_token = await bcrypt.hash(refreshToken, salt);
      auth.last_login = new Date();

      await this.authRepository.saveUserAuthDatails(auth);

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (err) {
      console.log('Fail to login ');
      throw err;
    }
  }

  async refreshSession(refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token missing from cookies');
      }
      const decoded = await this.jwtService.verifyAsync(refreshToken);
      const userId = decoded.userid;

      const auth =
        await this.authRepository.findCredentialsWithUserProfile(userId);

      if (!auth || !auth.refresh_token) {
        throw new UnauthorizedException('Session expired');
      }

      const isTokenMatch = await bcrypt.compare(
        refreshToken,
        auth.refresh_token,
      );
      if (!isTokenMatch) throw new UnauthorizedException('Invalid session');

      const payload = {
        userid: auth.user.user_id,
        email: auth.user.email /*role: auth.user.role */,
      };
      const newAccessToken = await this.jwtService.signAsync(payload, {
        expiresIn: '30m',
      });
      return {
        accessToken: newAccessToken,
        message: 'Token refreshed successfully',
      };
    } catch (err) {
      throw new UnauthorizedException('Session expired');
    }
  }

  async logout(accessToken: string) {
    try {
      if (!accessToken) {
        throw new UnauthorizedException('Access token is missing');
      }

      const decoded = this.jwtService.decode(accessToken) as any;

      if (!decoded || !decoded.userid) {
        throw new UnauthorizedException('Invalid access token structure');
      }

      const userId = decoded.userid;

      const auth = await this.authRepository.findCredentialsByUserId(userId);

      if (!auth) {
        throw new UnauthorizedException('Authentication record not found');
      }

      auth.refresh_token = null;

      return {
        message: 'Logout Successfully',
      };
    } catch (err) {
      console.error('Logout error processing:', err);
      throw err;
    }
  }
}
