import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';

interface JwtUser { sub: number; username: string }

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.cards.findAll(user.sub);
  }

  @Get('user/:id')
  getUserCards(@Param('id', ParseIntPipe) id: number) {
    return this.cards.findAll(id);
  }

  @Patch(':id')
  updateOwned(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body('owned') owned: number,
  ) {
    return this.cards.updateOwned(user.sub, id, owned);
  }

  @Patch(':id/name')
  updateName(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
  ) {
    return this.cards.updateName(user.sub, id, name);
  }
}
