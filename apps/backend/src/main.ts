import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as morgan from 'morgan';
import './constants';
import { PORT } from './constants';
import helmet from 'helmet';
import { PrismaService } from './services/prisma/prisma.service';
import "@total-typescript/ts-reset"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'warn'],
  });
  app.use(morgan('dev'));
  app.use(helmet());
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        'default-src': ["'self'"],
        'connect-src': ["'self'", 'blob:', 'wss:', 'websocket.domain'],
      },
    }),
  );
  app.enableCors();
  app.get(PrismaService).enableShutdownHooks(app);
  await app.listen(PORT);
  console.log(`Application is running on: http://localhost:${PORT}`);
}
bootstrap();
