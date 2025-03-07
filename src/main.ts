import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable global logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(process.env.APP_PORT ?? 3000, () => {
    console.log(`Server is running on PORT :${process.env.APP_PORT ?? 3000}`);
  });
}

bootstrap();
