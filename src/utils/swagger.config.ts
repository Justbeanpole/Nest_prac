import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setSwaggerConfig(app) {
  const documentOption = new DocumentBuilder()
    .setTitle('Prac API')
    .setDescription('Nest 연습용 Swagger API 서버')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, documentOption);

  SwaggerModule.setup('api', app, document);
}
