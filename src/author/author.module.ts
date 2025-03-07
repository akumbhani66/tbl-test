import { Module } from '@nestjs/common';
import { AuthorService } from './author.service';
import { AuthorController } from './author.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { KnexService } from './db/knex.service';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: `${process.env.NODE_ENV}.env` }),
    HttpModule,
  ],
  providers: [AuthorService, KnexService],
  controllers: [AuthorController],
})
export class AuthorModule {}
