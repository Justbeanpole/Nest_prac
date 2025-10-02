import dayjs from 'dayjs';
import * as fs from 'fs'; // 비동기 작업을 위한 promises API 사용
import * as winston from 'winston';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { CloudWatchLogManager } from './CloudManager/CloudLogManger.service';
import { S3Manager } from './S3Manager/S3Manager.service';
import readline from 'readline';
import { InputLogEvent } from '@aws-sdk/client-cloudwatch-logs';

interface LogData {
  label: string; // 프로젝트 이름
  level: string; // 로그 레벨 (e.g., info, error)
  timestamp: string; // 로그 타임스탬프
  message: string; // 로그 메시지
  data?: number | string | undefined;
  originalUrl?: string | undefined; // 요청된 원본 URL (선택적)
  method?: string | undefined; // HTTP 메소드 (선택적)
  statusCode?: number | undefined; // HTTP 상태 코드 (선택적)
  context?: string | undefined; // 로그 컨텍스트 (e.g., HTTP, AUTH) (선택적)
  ip?: string | undefined; // 클라이언트 IP (선택적)
  userAgent?: string | undefined; // 클라이언트 사용자 에이전트 (선택적)
  logVersion: string; // 로그 버전
  [key: string]: string | number; // 기타 추가적인 로그 필드
}

/**
 * LoggerManager Service
 * ---
 * Winston 로깅을 사용하여 애플리케이션의 에러 및 응답 로그를 처리합니다.
 * - `infoLog`가 true인 경우, 로그 파일을 `logs` 폴더에 저장합니다.
 * - `s3Log`가 true인 경우, `logs` 폴더에 저장된 로그 파일을 S3에 업로드하고 로컬에서 삭제합니다.
 */
@Injectable()
export class LoggerManager {
  private infoLogger: winston.Logger; // Winston 로거 인스턴스
  private errorLogger: winston.Logger; // Winston 로거 인스턴스
  private projectName = 'tests'; // 프로젝트 이름
  private readonly infoLog: boolean; // 로그 파일 저장 여부
  private readonly s3Log: boolean; // S3 업로드 여부
  private readonly cwLog: boolean; //Cloud Watch 업로드 여부
  private readonly context: string;
  private currentDate: string; // 현재 날짜를 추적하기 위한 변수

  constructor(
    private readonly configService: ConfigService, // 설정 서비스
    private readonly cwManager: CloudWatchLogManager,
    private readonly S3: S3Manager,
  ) {
    // 환경 변수에서 로그 저장 및 S3 업로드 여부를 설정
    this.infoLog = this.configService.get<string>('INFO_LOG') === 'true';
    this.s3Log = this.configService.get<string>('S3_LOG') === 'true';
    this.cwLog = this.configService.get<string>('CLOUDWATCH_LOG') === 'true';
    this.context =
      configService.get<string>('NODE_ENV') === 'production' ? 'HTTPS' : 'HTTP';
    // infoLog가 true인 경우, 로거 인스턴스 생성
    if (this.infoLog) {
      this.currentDate = this.getToday().date; // 초기 날짜 설정
      this.infoLogger = this.createInfoLogger(); // 로거 생성
      this.errorLogger = this.createErrorLogger(); // 로거 생성
    }
    // infoLog 및 s3Log 상태 출력
    console.log(`[libs][LoggerManager][INFO_LOG][${this.infoLog}]`);
    console.log(`[libs][LoggerManager][S3_LOG][${this.s3Log}]`);
  }

  /**
   * 현재 날짜와 어제 날짜를 조회합니다.
   * @returns 현재 날짜와 어제 날짜 정보를 포함하는 객체.
   */
  private getToday() {
    const d = dayjs().tz('Asia/Seoul'); // 현재 날짜와 시간을 서울 시간대에 맞춰 가져옴
    const dd = {
      year: `${d.year()}`, // 연도
      month: d.month() + 1 < 10 ? `0${d.month() + 1}` : `${d.month() + 1}`, // 월 (두 자릿수 포맷) 01,02,03,04월 처럼 한 자릿수 달은 0을 붙여줌
      day: d.date() < 10 ? `0${d.date()}` : `${d.date()}`, // 일 (두 자릿수 포맷) 월에서 두 자리 포맷하는 것과 같음
    };
    const yd = d.clone().subtract(1, 'day').startOf('day'); // 어제 날짜를 시작으로 설정
    const ydd = {
      yesterDayYear: yd.format('YYYY'), // 어제의 연도
      yesterDayMonth: yd.format('MM'), // 어제의 월
      yesterDay: yd.format('DD'), // 어제의 일
    };
    return {
      ...dd,
      date: `${dd.year}${dd.month}${dd.day}`, // 현재 날짜의 포맷 (YYYYMMDD)
      ...ydd,
    };
  }

  /**
   * Winston 인풋 로거를 생성합니다.
   * @returns Winston 로거 인스턴스.
   */
  private createInfoLogger() {
    const dd = this.getToday(); // 현재 날짜 정보 가져오기
    const myFormat = winston.format.printf(
      (info: winston.Logform.TransformableInfo) => {
        const formatLogData = this.format(info); // 로그 데이터 포맷
        return JSON.stringify(formatLogData); // JSON 문자열로 변환
      },
    );
    const loggingFormat = winston.format.combine(myFormat); // 로그 포맷 결합
    return winston.createLogger({
      transports: [
        new winston.transports.File({
          filename: `logs/${dd.year}/${dd.month}/log_${dd.day}.log`, // 정보 로그 파일 경로
          format: loggingFormat,
          level: 'info', // 로그 레벨
        }),
        // new winston.transports.Console({
        //   format: loggingFormat,
        //   level: 'info',
        // }),
      ],
    });
  }

  /**
   * Winston 에러 로거를 생성합니다.
   * @returns Winston 로거 인스턴스.
   */
  private createErrorLogger() {
    const dd = this.getToday(); // 현재 날짜 정보 가져오기
    const myFormat = winston.format.printf(
      (info: winston.Logform.TransformableInfo) => {
        const formatLogData = this.format(info); // 로그 데이터 포맷
        return JSON.stringify(formatLogData); // JSON 문자열로 변환
      },
    );
    const loggingFormat = winston.format.combine(myFormat); // 로그 포맷 결합
    return winston.createLogger({
      transports: [
        new winston.transports.File({
          filename: `logs/${dd.year}/${dd.month}/error_${dd.day}.log`, // 에러 로그 파일 경로
          format: loggingFormat,
          level: 'error', // 로그 레벨
        }),
        new winston.transports.Console({
          format: loggingFormat,
          level: 'error',
        }),
      ],
    });
  }

  /**
   * 로그 메시지를 포맷합니다.
   * @param info - Winston 로그 정보 객체.
   * @returns 포맷된 로그 데이터.
   */
  private format(info: any): LogData {
    const logInfo = info?.message;
    const data = info?.message?.data;
    const context = info.context || this.context;
    const message = typeof logInfo === 'string' ? logInfo : logInfo?.message;
    // console.log('message=????>>>>>', message);
    const logData: LogData = {
      timestamp: dayjs().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'), // 타임스탬프
      logVersion: 'V1', // 로그 버전
      label: this.projectName, // 프로젝트 이름
      level: info.level, // 로그 레벨
      // 요청 핵심
      ...(logInfo?.originalUrl && {
        originalUrl: logInfo?.originalUrl,
      }),
      ...(logInfo?.method && { method: logInfo?.method }),
      ...(logInfo?.statusCode && { statusCode: logInfo?.statusCode }),
      // 메세지 컨텍
      message, // 로그 메시지
      ...(data && { data }),
      context,
      //나머지
      ...(logInfo?.ip && { ip: logInfo?.ip }),
      ...(logInfo?.userAgent && { userAgent: logInfo?.userAgent }),
      ...(logInfo?.responseTime && {
        responseTime: `${logInfo?.responseTime} ms`,
      }),
    };
    return logData;
  }

  /**
   * 현재 날짜가 변경되었는지 확인하고, 변경된 경우 로거를 업데이트합니다.
   */
  private updateLoggerIfDateChanged() {
    const dd = this.getToday().date;
    if (this.currentDate !== dd) {
      this.currentDate = dd; // 현재 날짜 업데이트
      this.infoLogger = this.createInfoLogger(); // 새로운 로거 인스턴스 생성
      this.errorLogger = this.createErrorLogger(); // 새로운 로거 인스턴스 생성
    }
  }

  /**
   * 로그 {timestamp, message} 형태으로 변환 후, Object 배열 생성
   * @param filePath :string
   * @return InputLogEvent[]
   */
  private putLogFiletoCloudWatch(filePath: string) {
    const logEvents = []; // 로그 넣을 배열 선언
    return new Promise<InputLogEvent[]>((resolve, reject) => {
      //파일 존재 확인
      if (fs.existsSync(filePath)) {
        const fileStream = fs.createReadStream(filePath); //파일 불러오기
        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity, // 모든 개행 문자(\n, \r\n 등)를 한 줄로 인식
        });
        rl.on('line', (line) => {
          try {
            const { timestamp, ...data } = JSON.parse(line); //라인 별로 parse해서 timestamp, data로 구조 분할
            //포맷팅
            const format: InputLogEvent = {
              timestamp: Number(dayjs(timestamp).tz('Asia/Seoul')), //Number 형태가 필수
              message: JSON.stringify(data), //string 필수
            };
            logEvents.push(format); //배열에 추가
          } catch (e) {
            reject(e); //Error
          }
        });
        rl.on('close', () => {
          console.log('파일 읽기 완료!');
          resolve(logEvents); //완료 후 데이터 전달
        });
      } else {
        reject(`${filePath} was not found.`);
      }
    });
  }
  /**
   * Save Log to CloudWatch
   * @param logFilePath  : string
   * @param errorFilePath : string
   */
  private async logSavetoCloudWatch(
    logFilePath: string,
    errorFilePath: string,
  ) {
    try {
      const streamName = logFilePath.slice(5).replace('/log_', '/'); //logFilePath에서 텍스트 추출 ex)2025/09/25.log
      await this.cwManager.createLogStream(streamName); // Log Stream 생성

      const logData = await this.putLogFiletoCloudWatch(logFilePath); //log파일 읽어서 배열로 저장
      const errorLogData = await this.putLogFiletoCloudWatch(errorFilePath); //error Log파일 읽어서 배열로 저장
      const logEvents = [...logData, ...errorLogData]; // 형식에 맞춰 로그를 저장할 리스트
      const sortedLogs = logEvents.sort((a, b) => a.timestamp - b.timestamp); //오름차순 정렬 (필수) info, error 두 개 동시에 저장하기 때문에 시간대가 뒤죽박죽 -> 저장할 때, 정렬되어 있지 않으면 에러 발생
      await this.cwManager.putLogEvents(sortedLogs, streamName); //CloudWath 저장
    } catch (e: any | unknown) {
      throw Error(
        `[libs][LoggerManager][logSavetoCloudWatch] Error : ${e.message}`,
      );
    }
  }
  /**
   * Save Log to S3
   * @param filePath : string
   */
  private async logSavetoS3(filePath: string) {
    if (fs.existsSync(filePath)) {
      const infoFileBuffer = fs.readFileSync(filePath); // 파일 내용 읽기
      const file_name = filePath;
      const file = {
        buffer: infoFileBuffer,
        mimetype: 'log',
      };
      const result = await this.S3.uploadFile({ file_name, file }); // S3에 업로드
      if (result) {
        fs.unlinkSync(filePath); // 로컬 파일 삭제
      }
    }
  }

  /**
   * S3에 로그 파일을 저장하기 위한 스케줄 작업을 설정합니다.
   * 매일 00:10시에 로그 파일을 업로드하고 로컬 파일을 삭제합니다.
   * 10 0 * * *
   * @param projectName - 프로젝트 이름
   */
  @Cron('10 0 * * *', { timeZone: 'Asia/Seoul' })
  public async logSaveSchedule() {
    // s3Log와 cwLog가 동시에 false인 경우, 즉시 리턴
    if (!this.cwLog && !this.s3Log) {
      return;
    } else {
      try {
        const yd = this.getToday(); // 어제 날짜 정보 가져오기
        const infoFilePath = `logs/${yd.yesterDayYear}/${yd.yesterDayMonth}/log_${yd.yesterDay}.log`;
        const errorFilePath = infoFilePath.replace('/log_', '/error_'); //infoFilePath에서 추출하여 사용
        //cwLog가 true이면
        if (this.cwLog) {
          await this.logSavetoCloudWatch(infoFilePath, errorFilePath); //CloudWath에 Log 저장
        }
        //s3Log가 true이면
        if (this.s3Log) {
          await this.logSavetoS3(infoFilePath); //info 파일 S3에 저장
          await this.logSavetoS3(errorFilePath); //error 파일 S3에 저장
        }
      } catch (e: any | unknown) {
        this.errorLogger.error(
          `[libs][LoggerManager][logSaveSchedule] Error : ${e.message}`,
        );
        return e; // 오류 반환
      }
    }
  }

  /**
   * 정보 로그를 기록합니다.
   * @param message - 로그 메시지
   * @param context - 로그 컨텍스트
   */
  log(message: string, context?: string) {
    if (!this.infoLog) return; // infoLog가 false인 경우 아무 작업도 하지 않음
    if (context === 'RouterExplorer' || context === 'RoutesResolver') return; //기본 로그는 리턴
    this.updateLoggerIfDateChanged(); // 날짜가 변경되었는지 확인하고 로거 업데이트
    this.infoLogger.info({ message, context }); // 정보 로그 기록
  }

  /**
   * 에러 로그를 기록합니다.
   * @param message - 로그 메시지
   * @param trace - 에러 추적 정보 (선택적)
   * @param context - 로그 컨텍스트
   */
  error(message: string, context?: string) {
    console.log('error', message);
    if (!this.infoLog) return; // infoLog가 false인 경우 아무 작업도 하지 않음
    this.updateLoggerIfDateChanged(); // 날짜가 변경되었는지 확인하고 로거 업데이트
    this.errorLogger.error({ message, context }); // 에러 로그 기록
  }

  /**
   * 경고 로그를 기록합니다.
   * @param message - 로그 메시지
   * @param context - 로그 컨텍스트
   */
  warn(message: string, context?: string) {
    console.log('warn'); // 경고 로그를 콘솔에 출력 (디버깅 용도)
    this.infoLogger.warn(message, { context }); // 경고 로그 기록
  }

  /**
   * 디버그 로그를 기록합니다.
   * @param message - 로그 메시지
   * @param context - 로그 컨텍스트
   */
  debug?(message: string, context?: string) {
    console.log('debug'); // 디버그 로그를 콘솔에 출력 (디버깅 용도)
    this.infoLogger.debug(message, { context }); // 디버그 로그 기록
  }

  /**
   * 자세한 로그를 기록합니다.
   * @param message - 로그 메시지
   * @param context - 로그 컨텍스트
   */
  verbose?(message: string, context?: string) {
    console.log('verbose');
    this.infoLogger.verbose(message, { context }); // 자세한 로그 기록
  }
}
