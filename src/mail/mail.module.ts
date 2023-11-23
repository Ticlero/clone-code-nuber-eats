import { DynamicModule, Module } from '@nestjs/common';
import { MailModuleOption } from './mail.interface';
import { MAIL_CONFIG_TOKEN } from './mail.constant';
import { MailService } from './mail.service';

@Module({})
export class MailModule {
  static forRoot(options: MailModuleOption): DynamicModule {
    return {
      module: MailModule,
      global: options.isGlobal ? options.isGlobal : false,
      providers: [
        { provide: MAIL_CONFIG_TOKEN, useValue: options },
        MailService,
      ],
      exports: [MailService],
    };
  }
}
