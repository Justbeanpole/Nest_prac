import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import dayjs from 'dayjs';
import { LogData } from './log.data.interface';
/**
 * 모든 예외를 처리하는 글로벌 예외 필터
 *
 * - HTTP 예외(`HttpException`)의 경우 해당 상태 코드를 반환
 * - 기타 예외는 `500 INTERNAL_SERVER_ERROR`로 처리
 * - 응답 상태 코드는 항상 `200 OK`로 설정 (에러 메시지는 `data` 필드에 포함)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger();
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse(); // Res
    const req = ctx.getRequest(); //Req
    const { method, originalUrl, startTime } = req; // Req 내 요소 추출
    const userAgent = req.get('user-agent') || ''; // Req 내 user-agent 추출
    // Ip 추출
    const xForwardedFor = req?.headers['x-forwarded-for'];
    const ip = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor?.split(',')[0] || req?.ip || '127.0.0.1';
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Server error';
    let data: Record<string, any> | null = null;
    if (status === 500) {
      //API 에러
      data = exception?.message;
    } else if (status === 400) {
      //NEST DTO 에러
      message = exception?.message;
      data = exception?.response?.message || exception?.message;
    } else {
      //NEST AUTH 등 에러
      message = exception?.message;
      data = null;
    }
    const endTime = dayjs(); // 종료 시간
    const responseTime = endTime.diff(startTime, 'millisecond'); // 응답 시간 계산
    const logData: LogData = {
      method,
      statusCode: status,
      message,
      data,
      originalUrl,
      ip,
      userAgent,
      responseTime,
    };
    // Error 로깅
    this.logger.error(logData);

    res.status(status).json({
      status,
      message,
      ...(data && { data }),
    });
  }
}
