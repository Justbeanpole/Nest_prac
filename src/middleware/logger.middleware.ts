import { Injectable, NestMiddleware } from '@nestjs/common';
import dayjs from 'dayjs';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = dayjs();
    req['startTime'] = startTime;
    next();
  }
}
