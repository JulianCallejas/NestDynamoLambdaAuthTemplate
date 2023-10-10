import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import * as express from 'express';
import serverlessExpress from "@vendia/serverless-express";
import { Handler, Context, Callback } from 'aws-lambda';


let server: Handler

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  //await app.listen(3000);

  await app.init();
  const expressApp = await app.getHttpAdapter().getInstance();
  return serverlessExpress({app: expressApp});



}
export const handler: Handler = async (
    event: any,
    context: Context,
    callback: Callback) => {
        server = server ?? (await bootstrap());
        return server(event, context, callback);

    };
