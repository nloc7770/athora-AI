import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CsrfGuard } from './common/guards/csrf.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.use(compression({
    filter: (req, res) => {
      // Don't compress SSE streams — kills chunked transfer
      if (res.getHeader('Content-Type') === 'text/event-stream') {
        return false;
      }
      return compression.filter(req, res);
    },
  }));
  app.use(cookieParser());

  app.enableCors({
    origin: [
      configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
      configService.get<string>('ADMIN_URL', 'http://localhost:3002'),
    ],
    credentials: true,
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalGuards(new CsrfGuard());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });

  const port = configService.get<number>('PORT', 3001);
  const server = await app.listen(port);

  // Timeouts for load balancer compatibility (ALB default is 60s)
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  logger.log(`Application running on port ${port}`);
}

bootstrap();
