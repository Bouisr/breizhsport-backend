import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new ValidationExceptionFilter()); // Utiliser le filtre pour les dto

  app.enableCors({
    origin: `http://localhost:3000`,
    methods: `GET,HEAD,PUT,PATCH,POST,DELETE`,
    allowedHeaders: `Content-Type, Authorization`,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 8000);
}

bootstrap();
