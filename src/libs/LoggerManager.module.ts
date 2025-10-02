import { Module } from '@nestjs/common';
import { LoggerManager } from './LoggerManager.service';
import { LoggerInterceptor } from './LoggerInterceptor';
import { S3ManagerModule } from './S3Manager/S3Manager.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CloudManagerModule } from './CloudManager/CloudManager.module';

@Module({
  imports: [S3ManagerModule, ScheduleModule.forRoot(), CloudManagerModule],
  providers: [LoggerManager, LoggerInterceptor],
  exports: [LoggerManager, LoggerInterceptor],
})
export class LoggerManagerModule {}
