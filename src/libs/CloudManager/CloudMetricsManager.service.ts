import {
  CloudWatchClient,
  CloudWatchServiceException,
  ListMetricsCommand,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudWatchMatricsManager {
  private readonly cwClient: CloudWatchClient;
  constructor(private readonly configService: ConfigService) {
    this.cwClient = new CloudWatchClient({
      region: this.configService.get<string>('AWS_BUCKET_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_KEY'),
      },
    });
  }

  async putMetricData() {
    const command = new PutMetricDataCommand({
      Namespace: 'Local/Traffic', // 지표를 그룹화하는 네임스페이스
      MetricData: [
        {
          MetricName: 'RequestLatency',
          Dimensions: [
            // 지표를 세분화하는 차원
            {
              Name: 'Environment',
              Value: 'Production',
            },
          ],
          Timestamp: new Date(),
          Value: 14, // 측정된 값 (예: 150.5ms)
          Unit: 'Milliseconds', // 값의 단위
          StorageResolution: 1, // 1초 단위 고해상도로 저장
        },
      ],
    });

    try {
      return await this.cwClient.send(command);
    } catch (err) {
      console.error(err);
    }
  }

  async listMetric() {
    const command = new ListMetricsCommand({
      Namespace: 'Local/Traffic',
      Dimensions: [
        {
          Name: 'Environment',
          Value: 'Production',
        },
      ],
      MetricName: 'RequestLatency',
    });

    try {
      const response = await this.cwClient.send(command);
      console.log(`Metrics count: ${response.Metrics?.length}`);
      return response;
    } catch (caught) {
      if (caught instanceof CloudWatchServiceException) {
        console.error(
          `Error from CloudWatch. ${caught.name}: ${caught.message}`,
        );
      } else {
        throw caught;
      }
    }
  }
}
