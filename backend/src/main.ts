import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { requestLoggerMiddleware } from './observability/request-logger.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Logs structurés (JSON) pour suivi perf/ops
  app.use(requestLoggerMiddleware);

  //  Activation validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // supprime champs non définis dans DTO
      forbidNonWhitelisted: true, // erreur si champ non autorisé
      transform: true,          // transforme types (string -> number si DTO le demande)
    }),
  );

  // Swagger UI (OpenAPI)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DataShare API')
    .setDescription('API du projet DataShare (auth + fichiers + téléchargement public).')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

