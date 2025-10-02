import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/db.module';
import { UserModule } from './api/user/user.module';
import { MorganModule } from 'nest-morgan';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import dayjs from 'dayjs';
import { LoggerManagerModule } from './libs/LoggerManager.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { CloudManagerModule } from './libs/CloudManager/CloudManager.module';

//Dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    LoggerManagerModule,
    CloudManagerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
