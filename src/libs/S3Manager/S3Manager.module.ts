import { Module } from '@nestjs/common';
import { S3Manager } from './S3Manager.service';

@Module({
  imports: [],
  providers: [S3Manager],
  exports: [S3Manager],
})
export class S3ManagerModule {}
