import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async register(username: string, password: string, displayName: string) {
    if (!username?.trim() || !password || !displayName?.trim()) {
      throw new BadRequestException('Всі поля обов\'язкові');
    }
    if (password.length < 4) {
      throw new BadRequestException('Пароль занадто короткий (мін. 4 символи)');
    }
    const clean   = username.trim().toLowerCase().slice(0, 30);
    const display = displayName.trim().slice(0, 40);

    if (await this.users.findByUsername(clean)) {
      throw new ConflictException('Цей нікнейм вже зайнятий');
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await this.users.create(clean, hash, display);
    const token = this.jwt.sign({ sub: user.id, username: user.username });
    return {
      token,
      user: { id: user.id, username: user.username, displayName: user.display_name },
    };
  }

  async login(username: string, password: string) {
    if (!username?.trim() || !password) {
      throw new BadRequestException('Введіть нікнейм та пароль');
    }
    const clean = username.trim().toLowerCase();
    const user  = await this.users.findByUsername(clean);
    if (!user) throw new UnauthorizedException('Невірний нікнейм або пароль');
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Невірний нікнейм або пароль');
    const token = this.jwt.sign({ sub: user.id, username: user.username });
    return {
      token,
      user: { id: user.id, username: user.username, displayName: user.display_name },
    };
  }
}
