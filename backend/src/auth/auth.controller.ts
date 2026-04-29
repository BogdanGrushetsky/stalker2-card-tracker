import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('displayName') displayName: string,
  ) {
    return this.auth.register(username, password, displayName);
  }

  @Post('login')
  @HttpCode(200)
  login(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.auth.login(username, password);
  }
}
