import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Module({
  controllers: [CardsController],
  providers: [CardsService, JwtAuthGuard],
})
export class CardsModule {}
