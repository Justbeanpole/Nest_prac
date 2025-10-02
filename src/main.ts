import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import { setSwaggerConfig } from './utils/swagger.config';
import { LoggerManager } from './libs/LoggerManager.service';
import { LoggerInterceptor } from './libs/LoggerInterceptor';
import { AllExceptionsFilter } from './libs/allExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(LoggerManager);
  const loggerInterceptor = app.get(LoggerInterceptor);
  // 애플리케이션의 로거 설정
  app.useLogger(logger);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(loggerInterceptor);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //DTO에 정의되지 않은 속성이 들어오면 자동으로 제거
      transform: true, //DTO에 정의된 필드 유형이 일치하지 않는 경우 자동으로 타입 변환.
      transformOptions: {
        enableImplicitConversion: true, //string -> number, bool, array로의 암시적 변환이 가능 ex) "10" -> 10
      },
    }),
  );

  setSwaggerConfig(app);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
