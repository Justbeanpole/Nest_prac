export interface LogData {
  method: string;
  statusCode: number;
  message: string;
  data?: null | object | object[];
  originalUrl: string;
  ip: string;
  userAgent: string;
  responseTime: number;
}
