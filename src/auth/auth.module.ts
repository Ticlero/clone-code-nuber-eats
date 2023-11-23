import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD, //gurd를 app 모든 곳에 사용하고 싶을 때, APP_GUARD를 사용한다.
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
