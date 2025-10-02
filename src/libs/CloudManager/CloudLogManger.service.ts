import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  InputLogEvent,
  PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Injectable()
export class CloudWatchLogManager implements OnModuleInit {
  private readonly cwClient: CloudWatchLogsClient; 
  private readonly logger = new Logger();  
  private readonly logGroup: string; //CloudWatch Log Group 이름 저장 변수
  constructor(private readonly configService: ConfigService) {
    this.logGroup = this.configService.get<string>('LOG_GROUP'); //Log Group 이름 불러오기
    //CloudWatch 초기화
    this.cwClient = new CloudWatchLogsClient({
      region: this.configService.get<string>('AWS_BUCKET_REGION'), //Region
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY'), //Access Key
        secretAccessKey: this.configService.get<string>('AWS_SECRET_KEY'), //Secret Key
      },
    });
  }

  /**
   * 시작 시 한 번 호출되는 함수
   * CloudWatch Log Group 생성
   * @returns 그룹 생성을 요청하고, 그 결과를 반환합니다.
   */
  async onModuleInit() {
    const command = new CreateLogGroupCommand({
      logGroupName: this.logGroup, // required :string | undefined
    });
    try {
      return await this.cwClient.send(command);
    } catch (e: any | unknown) {
      if (e.name === 'ResourceAlreadyExistsException') {
        this.logger.log(`Log Group '${this.logGroup}' already exists.`);
      } else {
        console.log(`[lib][CloudWatchManger][onModuleInit] Error ${e.message}`);
      }
    }
  }
  
  /**
   * CloudWatch Log Stream 생성
   * @param streamName : string | undefined
   * @returns 스트림을 생성을 요청하고, 그 결과를 반환합니다.
   */
  async createLogStream(streamName : string) {
    const command = new CreateLogStreamCommand({
      logGroupName: this.logGroup, // required :string | undefined
      logStreamName: streamName, // required :string | undefined
    });
    try {
      return await this.cwClient.send(command);
    } catch (e: any | unknown) {
      throw new Error(
        `[lib][CloudWatchManger][createLogStream] Error ${e.message}`,
      );
    }
  }

  /**
   * Upload file to CloudWatch
   * @param data : InputLogEvent[]
   * @param streamName : string
   * @return CloudWatch Logs에 로그 전송을 요청하고, 그 결과를 반환합니다.
   */
  async putLogEvents(data : InputLogEvent[], streamName : string) {
    const command = new PutLogEventsCommand({
      // PutLogEventsRequest
      logGroupName: this.logGroup, // required : string | undefined
      logStreamName: streamName, // required : string | undefined
      logEvents: data, // InputLogEvent[] | undefined; InputLogEvent{timestamp: number | undefined; message: string | undefined;}
    });
    try {
      return await this.cwClient.send(command);
    } catch (e : any | unknown) {
      throw new Error(
        `[lib][CloudWatchManger][putLogEvents] Error : ${e.message}`,
      );
    }
  }
}
