import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { requestLoggerMiddleware } from './observability/request-logger.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers (Helmet). CSP n'est pas strict pour laisser fonctionner l'interface
  // UI Swagger UI.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          // L’interface Swagger UI utilise des styles/scripts inline,
          // Ce n’est donc pas une politique CSP "stricte",
          // mais elle reste applicable tout en gardant /api-docs fonctionnel.
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'blob:'],
          'font-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

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

