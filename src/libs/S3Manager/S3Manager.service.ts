import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface File {
  file_name: string;
  file: { buffer: Buffer; mimetype?: string };
}

export interface Files {
  files: { buffer: Buffer; mimetype?: string }[];
  file_names: string;
}
export interface Download {
  type: 'buffer' | 'url';
  file_name: string;
}
/**
 * S3Manager Service
 * --
 * AWS S3(S3)을 통해 파일응 업로드 및 다운로드 서비스를 제공합니다.
 */
@Injectable()
export class S3Manager {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private logger = new Logger();
  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_BUCKET_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_KEY'),
      },
    });
    this.bucket = this.configService.get<string>('AWS_BUCKET_NAME');
  }

  /**
   * File download from S3
   * @param key : string
   * @returns Promise<Buffer>
   */
  async fileDownload(info: Download): Promise<Buffer | string> {
    try {
      const { type, file_name } = info;
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: file_name,
      });
      const response = await this.s3.send(command);
      const stream = response.Body as Readable;

      const result = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (e: any | unknown) => reject(e));
      });
      if (type === 'url') {
        const bufferUrl = result.toString('base64');
        return `data:image/png;base64,${bufferUrl}`;
      } else {
        return result;
      }
    } catch (e: any | unknown) {
      throw new Error(
        `[lib][S3Manager][fileDownload] Error ${(e as Error).message}`,
      );
    }
  }

  /**
   * Upload file to S3
   * @param fileInfo : File
   * @param bucket: string
   * @returns Promise<string>
   */
  async uploadFile(fileInfo: File, bucket?: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket ? bucket : this.bucket,
        // Body: fileInfo.file.buffer,
        // ContentType: fileInfo.file.mimetype,
        Key: fileInfo.file_name,
      });
      const result = await this.s3.send(command);

      this.logger.log({
        message: '[lib][S3Manager][uploadFile]',
        data: result,
      });
      return fileInfo.file_name;
    } catch (e: any | unknown) {
      throw new Error(
        `[lib][S3Manager][uploadFile] Error ${(e as Error).message}`,
      );
    }
  }

  /**
   * Upload multiple files to S3
   * @param filesInfo : Files
   * @param bucket : string
   */
  // async uploadFileMulti(filesInfo: Files, bucket?: string) {
  //   try {
  //     const {
  //       files,
  //       file_names } = filesInfo;
  //     const file_name = JSON.parse(file_names);
  //     const uploadPromises = files.map(async (files, index) => {
  //       const command = new PutObjectCommand({
  //         Bucket: bucket || this.bucket,
  //         Body: files.buffer,
  //         ContentType: files.mimetype,
  //         Key: file_name[index],
  //       });
  //       const result = await this.s3.send(command);
  //       this.logger.log({
  //         message: '[lib][S3Manager][uploadFileMulti]',
  //         data: result.$metadata,
  //       });
  //       return {
  //         file_name: files.originalname,
  //         file_url: file_name[index],
  //       };
  //     });
  //     // 모든 파일이 업로드될 때까지 기다립니다.
  //     const uploadedFileNames = await Promise.all(uploadPromises);
  //     return uploadedFileNames;
  //   } catch (e: any | unknown) {
  //     console.log(`[lib][S3Manager][uploadFileMulti] Error : `, e);
  //     throw new Error(
  //       `[lib][S3Manager][uploadFileMulti] Error ${(e as Error).message}`,
  //     );
  //   }
  // }
}
