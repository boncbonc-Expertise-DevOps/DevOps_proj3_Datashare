import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //  Activation validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // supprime champs non définis dans DTO
      forbidNonWhitelisted: true, // erreur si champ non autorisé
      transform: true,          // transforme types (string -> number si DTO le demande)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

