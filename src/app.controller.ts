import { Controller, Get, Inject, Logger, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CloudWatchLogManager } from './libs/CloudManager/CloudLogManger.service';
import fs from 'fs';
import readline from 'readline';
import dayjs from 'dayjs';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cwManager: CloudWatchLogManager,
  ) {}

  @Get('/log')
  async getHello() {
    const logFilePath = `logs/2025/09/log_18.log`;
    console.log(`오늘 읽을 로그 파일: ${logFilePath}`);

    const logEvents = [];

    //파일이 존재하는지 먼저 확인
    if (fs.existsSync(logFilePath)) {
      const fileStream = fs.createReadStream(logFilePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity, // 모든 개행 문자(\n, \r\n 등)를 한 줄로 인식
      });
      rl.on('line', (line) => {
        try {
          const { timestamp, ...data } = JSON.parse(line);
          const format = {
            timestamp: Number(dayjs(timestamp)),
            message: JSON.stringify(data),
          };
          logEvents.push(format);
        } catch (e) {
          console.log('Error : ', e);
        }
      });

      rl.on('close', () => {
        console.log('파일 읽기 완료!');
        // this.cwManager.putLogEvents(logEvents, streamName);
      });
    } else {
      console.log('오늘 날짜의 로그 파일이 존재하지 않습니다.');
    }
    return { data: 'something' };
  }

  @Post('/log')
  async postLog() {
    return { data: 'anything' };
  }
}
