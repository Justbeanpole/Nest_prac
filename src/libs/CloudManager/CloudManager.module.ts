import { Global, Module } from '@nestjs/common';
import { CloudWatchLogManager } from './CloudLogManger.service';

@Module({
  imports: [],
  providers: [CloudWatchLogManager],
  exports: [CloudWatchLogManager],
})
export class CloudManagerModule {}
