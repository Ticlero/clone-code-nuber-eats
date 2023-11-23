import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { MAIL_CONFIG_TOKEN } from './mail.constant';
import { EmailVars, MailModuleOption } from './mail.interface';
import fetch from 'node-fetch';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_CONFIG_TOKEN) private readonly mailOptions: MailModuleOption,
  ) {}

  async sendEmail(
    subject: string,
    to: string,
    templateName: string,
    emailVars: EmailVars[],
  ): Promise<boolean> {
    const formData = new FormData();
    formData.append('from', `Excited User <${this.mailOptions.fromEmail}>`);
    formData.append('to', to);
    formData.append('subject', `${subject}`);
    formData.append('template', `${templateName}`);
    emailVars.forEach((vars) => {
      formData.append(`v:${vars.key}`, vars.value);
    });
    try {
      await fetch(
        `https://api.mailgun.net/v3/${this.mailOptions.domain}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.mailOptions.apiKey}`,
            ).toString('base64')}`,
          },
          body: formData,
        },
      );
      return true;
    } catch (e) {
      // console.log(e);
      return false;
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('인증을 위해 확인해주세요!', email, 'simple-template', [
      { key: 'username', value: email },
      { key: 'code', value: code },
    ]);
  }
}
