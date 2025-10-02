import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
@Injectable()
export class AppService {
   private logger = new Logger();
  getHello(): string {
    return 'Hello World!';
    
  }
}
