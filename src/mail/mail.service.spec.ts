import { Test } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MAIL_CONFIG_TOKEN } from './mail.constant';
import * as FormData from 'form-data';
import fetch from 'node-fetch';

jest.mock('form-data');
jest.mock('node-fetch');

const TEST_DOMAIN = 'test-domain';

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MAIL_CONFIG_TOKEN,
          useValue: {
            apiKey: 'test-apiKey',
            domain: TEST_DOMAIN,
            fromEmail: 'test-fromEmail',
            isGlobal: true,
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('sendEmail 함수 호출', () => {
      const sendVerificationEmailArgs = {
        email: 'email',
        code: 'code',
      };

      jest.spyOn(service, 'sendEmail').mockImplementation(async () => {
        return true;
      });

      service.sendVerificationEmail(
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );
      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith(
        '인증을 위해 확인해주세요!',
        'email',
        'simple-template',
        [
          { key: 'username', value: sendVerificationEmailArgs.email },
          { key: 'code', value: sendVerificationEmailArgs.code },
        ],
      );
    });
  });
  describe('sendEmail', () => {
    it('sendEmail 테스트', async () => {
      const formSpy = jest.spyOn(FormData.prototype, 'append');
      const ok = await service.sendEmail('', '', '', [
        { key: 'username', value: 'email' },
        { key: 'code', value: 'code' },
      ]);
      expect(formSpy).toHaveBeenCalled();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`,
        expect.any(Object),
      );
      expect(ok).toEqual(true);
    });

    it('메일 전송에 실패할 경우', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValue(new Error());
      const ok = await service.sendEmail('', '', '', [
        { key: 'username', value: 'email' },
        { key: 'code', value: 'code' },
      ]);
      expect(ok).toEqual(false);
    });
  });
});
