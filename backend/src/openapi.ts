import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';

async function generateOpenApi() {
  // On crée l'application Nest sans l'écouter : juste pour introspecter les routes.
  const app = await NestFactory.create(AppModule, { logger: false });

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

  const repoRoot = path.resolve(process.cwd(), '..');
  const outDir = path.join(repoRoot, 'documentation');
  mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2), { encoding: 'utf-8' });

  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI generated: ${outPath}`);
}

generateOpenApi().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
