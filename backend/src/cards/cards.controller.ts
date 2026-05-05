import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
  ServiceUnavailableException,
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

  @Post('parse-notes')
  async parseNotes(@Body('text') text: string) {
    if (!text?.trim()) throw new BadRequestException('text is required');
    try {
      return await this.cards.parseNotes(text);
    } catch (e) {
      throw new ServiceUnavailableException(
        e instanceof Error ? e.message : 'Ollama недоступний',
      );
    }
  }

  @Post('apply-parsed')
  applyParsed(
    @CurrentUser() user: JwtUser,
    @Body('entries') entries: { cardNumber: number; owned: number }[],
    @Body('mode') mode: 'full' | 'merge',
  ) {
    if (!entries?.length)                        throw new BadRequestException('entries required');
    if (mode !== 'full' && mode !== 'merge')     throw new BadRequestException('mode must be full or merge');
    return this.cards.applyParsed(user.sub, entries, mode);
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
