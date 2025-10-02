import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function DatabaseConfig(configService: ConfigService) {
  const option: TypeOrmModuleOptions = {
    type: 'mysql', // DB 종류
    host: configService.get(`DATABASE_HOST`), // HOST 정보
    port: +configService.get<number>(`DATABASE_PORT`, 3306), // PORT 정보
    username: configService.get(`DATABASE_USER`), // DB 아이디
    password: configService.get(`DATABASE_PASSWORD`), // DB 비밀번호
    database: configService.get(`DATABASE_NAME`), // 데이터베이스명
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
  };
  return option;
}
