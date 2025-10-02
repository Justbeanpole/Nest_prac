import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { LogData } from './log.data.interface';



/**
 * LoggerMiddleware
 * ---
 */
// @Injectable()
// export class LoggerMiddleware implements NestMiddleware {
  // private logger = new Logger();

  // use(req: Request, res: Response, next: NextFunction) {
  //   const startTime = dayjs(); // 요청 시작 시간 기록
  //   const { method, originalUrl } = req;
  //   const xForwardedFor = req?.headers['x-forwarded-for'];
  //   const ip = Array.isArray(xForwardedFor)
  //     ? xForwardedFor[0]
  //     : xForwardedFor?.split(',')[0] || req?.ip || '127.0.0.1';
  //   const userAgent = req.get('user-agent') || '';
  //   //인풋 로깅
  //   if (method === 'POST' || method === 'PUT') {
  //     this.logger.log({
  //       method,
  //       message: 'request',
  //       originalUrl,
  //       data: req?.body,
  //       ip,
  //       userAgent,
  //     });
  //   }

  //   const logData: LogData = {
  //     method,
  //     statusCode: 0,
  //     message: 'success',
  //     data: null,
  //     originalUrl,
  //     ip,
  //     userAgent,
  //     responseTime: 0,
  //   };

  //   // 응답 본문을 저장할 변수를 선언
  //   let responseBody: Record<string, any> = {};
  //   //응답 인터셉트
  //   const originalJsonMethod = res.json;
  //   res.json = function (body: any): any {
  //     responseBody = body;
  //     return originalJsonMethod.call(res, body);
  //   };
  //   //redirect 인터셉트, res.body 내에 redirect url 저장 및 이동.
  //   res.redirect = function (url) {
  //     responseBody = {
  //       message: 'success',
  //       data: { redirect: url },
  //       status: res?.statusCode ?? 302,
  //     };
  //     res.status(302).setHeader('Location', url).send();
  //     return;
  //   };

  //   res.on('finish', () => {
  //     const endTime = dayjs(); // 응답 완료 시간 기록
  //     logData.responseTime = endTime.diff(startTime, 'millisecond'); // ms 단위로 시간 차이 계산
  //     const { status, message, data } = responseBody;
  //     logData.statusCode = status || res.statusCode || 500;
  //     if (logData.statusCode === 200 || logData.statusCode === 201) {
  //       logData.message = message;
  //       logData.data = logData.method !== 'GET' && data;
  //       this.logger.log(logData); // Log successful response
  //     } else {
  //       logData.message = message;
  //       logData.data = data;
  //       this.logger.error(logData); // Log error response
  //     }
  //   });
  //   res.on('error', () => {
  //     const endTime = dayjs(); // 응답 완료 시간 기록
  //     logData.responseTime = endTime.diff(startTime, 'millisecond'); // ms 단위로 시간 차이 계산
  //     logData.statusCode = res?.statusCode || 500;
  //     logData.message = 'Error occurred';
  //     // 버퍼로 응답 데이터를 캡처할 변
  //     this.logger.error(logData);
  //   });

  //   next();
  // }
// }
