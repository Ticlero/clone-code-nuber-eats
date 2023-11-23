import { Test } from '@nestjs/testing';
import { JwtService } from './jwt.service';
import { CONFIG_OPTIONS } from './jwt.constant';
import * as jwt from 'jsonwebtoken';

const TEST_KEY = 'testKey';
const PAYLOAD = { id: 1, name: 'test' };

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => {
      return 'TOKEN';
    }),
    verify: jest.fn(() => {
      return PAYLOAD;
    }),
  };
});
describe('JwtService', () => {
  let service: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { privateKey: TEST_KEY },
        },
      ],
    }).compile();
    service = module.get<JwtService>(JwtService);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('return JWT Sign 토큰 반환', () => {
      const token = service.sign(PAYLOAD);
      expect(typeof token).toBe('string');
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith(PAYLOAD, TEST_KEY);
    });
  });
  describe('verify', () => {
    it('반환된 토큰을 해독하는 값을 반환', () => {
      const TOKEN = 'TOEKN';
      const decodedToken = service.verify(TOKEN);
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(TOKEN, TEST_KEY);
      expect(decodedToken).toEqual(PAYLOAD);
    });
  });
});
