import { utilities, WinstonModule } from 'nest-winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as winston from 'winston';

const logDir = __dirname + '/../../logs'; // log 파일을 관리할 폴더

const dailyOptions = (level: string) => {
  return {
    level,
    datePattern: 'YYYY-MM-DD',
    dirname: logDir + `/${level}`,
    filename: `%DATE%.${level}.log`,
    maxFiles: 30, //30일치 로그파일 저장
    zippedArchive: true, // 로그가 쌓이면 압축하여 관리
  };
};

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.label(),
        winston.format.splat(),
        winston.format.json(),
        utilities.format.nestLike('app', {
          prettyPrint: true, // nest에서 제공하는 옵션. 로그 가독성을 높여줌
        }),
      ),
    }),

    // info, warn, error 로그는 파일로 관리
    new DailyRotateFile(dailyOptions('info')),
  ],
});
