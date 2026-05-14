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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
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

  @Post('ai-analysis')
  async aiAnalysis(
    @CurrentUser() user: JwtUser,
    @Body('target') target: number,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    try {
      for await (const chunk of this.cards.streamAnalysis(user.sub, target || 1)) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
    } catch (e) {
      res.write(`data: ${JSON.stringify({ error: e instanceof Error ? e.message : 'Ollama недоступний' })}\n\n`);
    } finally {
      res.end();
    }
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
