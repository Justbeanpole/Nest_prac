import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import dayjs from 'dayjs';
import { map, Observable, tap } from 'rxjs';

interface LogData {
  method: string;
  statusCode: number;
  message: string;
  data?: null | object | object[];
  originalUrl: string;
  ip: string;
  userAgent: string;
  responseTime: number;
}

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private logger = new Logger();
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<object> {
    const req = context.switchToHttp().getRequest(); //Resquest 불러오기
    const { method, originalUrl, startTime } = req; //requset 값 method, originalUrl, startTime 할당
    const xForwardedFor = req?.headers['x-forwarded-for'];
    const ip = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor?.split(',')[0] || req?.ip || '127.0.0.1';
    const userAgent = req.get('user-agent') || '';

    //인풋 로깅
    if (method === 'POST' || method === 'PUT') {
      this.logger.log({
        method,
        message: 'request',
        originalUrl,
        data: req?.body,
        ip,
        userAgent,
      });
    }

    const logData: LogData = {
      method,
      statusCode: 0,
      message: 'success',
      data: null,
      originalUrl,
      ip,
      userAgent,
      responseTime: 0,
    };

    return (
      next
        .handle() //라우트 핸들러를 실행
        //컨트롤러가 모든 작업을 마치고 값을 return 한 후에 실행되는 후처리 로직
        .pipe(
          tap((data) => {
            const response = context.switchToHttp().getResponse();
            const endTime = dayjs(); // 응답 완료 시간 기록
            logData.responseTime = endTime.diff(startTime, 'millisecond'); // ms 단위로 시간 차이
            // 계산
            logData.statusCode = response.statusCode || 500;
            if (logData.statusCode === 200 || logData.statusCode === 201) {
              logData.message = 'success';
              data.redirect
                ? (logData.data = data)
                : (logData.data = logData.method !== 'GET' && data);
              this.logger.log(logData); // Log successful response
            } else {
              logData.message = response.message;
              logData.data = data;
              this.logger.error(logData); // Log error response
            }
          }),
          // 응답 객체를 새로 생성된 객체의 데이터 프로퍼티에 할당
          map((data) => {
            const response = context.switchToHttp().getResponse();
            return data.redirect
              ? response.redirect(data.redirect)
              : {
                  status: logData.statusCode,
                  message: logData.message,
                  ...(data && { data }),
                };
          }),
        )
    );
  }
}
