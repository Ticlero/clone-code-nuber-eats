import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { describe } from 'node:test';
import { Repository } from 'typeorm';

const mockUserRepo = () => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  findOneOrFail: jest.fn(),
});

const mockJwtService = () => {
  return {
    sign: jest.fn(() => {
      return 'testsetset';
    }),
    verify: jest.fn(),
  };
};

const mockMailService = () => {
  return {
    sendVerificationEmail: jest.fn(),
  };
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let usersRepo: MockRepository;
  let verifyRepo: MockRepository;
  let mailService: MailService;
  let jwtService: JwtService;
  //User Service를 테스트 하기 위해 UserService가 필요하다.
  //그러기 위해서 모듈역할을 하는 것이 필요한데, 다음은 테스트를 하기 위해 일단 테스트를 위한 모듈을 만드는 것이다.
  beforeEach(async () => {
    //TypeORM이 DB에 접근 가능한 Repo를 만들어주는데, 테스트할 떈 연결 할 수 없어 발생하는 오류이다.
    //이를 해결하기위해, Mock Repository를 생성할 것이다. Mocking을 Test 하면서 자주 볼 텐데, 가짜라는 뜻이다.
    //유닛테스트를 하기 위해서는 가짜가 필요하기 때문
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockUserRepo(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    usersRepo = module.get(getRepositoryToken(User));
    verifyRepo = module.get(getRepositoryToken(Verification));
  });

  // it('Should be defined', () => {
  //   expect(service).toBeDefined();
  //   expect(mailService).toBeDefined();
  // });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'test@naver.com',
      password: 'tests',
      role: 0,
    };
    it('유저가 존재하면 실패', async () => {
      usersRepo.findOneBy.mockResolvedValue({
        id: 1,
        email: 'test@naver.com',
      });
      const result = await service.createAccount(createAccountArgs);

      expect(result).toMatchObject({
        ok: false,
        error: '이미 존재하는 아이디',
      });
    });

    it('유저 생성 테스트', async () => {
      usersRepo.findOneBy.mockReturnValue(undefined);
      usersRepo.create.mockReturnValue(createAccountArgs);
      usersRepo.save.mockResolvedValue(createAccountArgs);

      verifyRepo.create.mockReturnValue({ user: createAccountArgs });
      verifyRepo.save.mockResolvedValue({
        code: 'testtest',
        ...createAccountArgs,
      });
      const result = await service.createAccount(createAccountArgs);

      expect(usersRepo.create).toHaveBeenCalledTimes(1); // create함수가 몇번 호출 되는지 지정하는 기능
      expect(usersRepo.create).toHaveBeenCalledWith(createAccountArgs); // create함수가 어떤 것과 같이 호출 됐는지 테스트 하는 기능
      expect(usersRepo.save).toHaveBeenCalledTimes(1);
      expect(usersRepo.save).toHaveBeenCalledWith(createAccountArgs);

      expect(verifyRepo.create).toHaveBeenCalledTimes(1);
      expect(verifyRepo.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      expect(verifyRepo.save).toHaveBeenCalledTimes(1);
      expect(verifyRepo.save).toHaveBeenCalledWith({ user: createAccountArgs });

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );

      expect(result).toEqual({ ok: true });
    });

    it('생성 실패 테스트', async () => {
      usersRepo.findOneBy.mockRejectedValue(new Error());
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({
        ok: false,
        error: '계정을 생성할 수 없습니다.',
      });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'test@naver.com',
      password: 'tests',
    };
    it('사용자를 찾을 수 없는 경우', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const result = await service.login(loginArgs);
      expect(usersRepo.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepo.findOne).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        ok: false,
        error: '유저를 찾을 수 없습니다.',
      });
    });

    it('비밀번호가 잘 못되었을 경우', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => {
          return Promise.resolve(false);
        }),
        role: 0,
      };
      usersRepo.findOne.mockResolvedValue({ ...loginArgs, ...mockedUser });
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: '잘못된 비밀번호',
      });
    });

    it('로그인 성공해서 토큰 전달하는 경우', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => {
          return Promise.resolve(true);
        }),
        role: 0,
      };
      usersRepo.findOne.mockResolvedValue({ ...loginArgs, ...mockedUser });
      const result = await service.login(loginArgs);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Object));

      expect(result).toEqual({ ok: true, token: 'testsetset' });
    });

    it('로그인에 어떤 문제가 발생하여 tc문에 걸리는 경우', async () => {
      usersRepo.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: '서버에 문제가 발생하였습니다.',
      });
    });
  });
  describe('findById', () => {
    const mockUser = {
      id: 1,
      email: 'testset@tsets.com',
      password: 'testtes',
    };
    it('id로 사용자 찾는 기능 테스트', async () => {
      usersRepo.findOneOrFail.mockResolvedValue({ ok: true, user: mockUser });
      const result = await service.findById(1);
      expect(usersRepo.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepo.findOneOrFail).toHaveBeenCalledWith(expect.any(Object));

      expect(result).toEqual({
        ok: true,
        user: {
          ok: true,
          user: { id: 1, email: 'testset@tsets.com', password: 'testtes' },
        },
      });
    });

    it('DB에서 ID로 사용자를 찾을 수 없는 경우', async () => {
      usersRepo.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);
      expect(usersRepo.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        ok: false,
        user: null,
        error: '해당하는 유저를 찾을 수 없습니다. id=[1]',
      });
    });
  });

  describe('getUserProfile', () => {
    const mockUser = {
      id: 1,
      email: 'testset@tsets.com',
      password: 'testtes',
    };
    it('유저를 찾을 수 없는 경우', async () => {
      usersRepo.findOneOrFail.mockRejectedValue(new Error());
      // const { ok, error } = await service.findById(1);
      const result = await service.getUserProfile(1);
      expect(usersRepo.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: false, error: 'User Not Found!' });
    });

    it('유저를 찾았을 경우', async () => {
      usersRepo.findOneOrFail.mockResolvedValue(mockUser);
      const result = await service.getUserProfile(1);
      expect(usersRepo.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        user: { id: 1, email: 'testset@tsets.com', password: 'testtes' },
        ok: true,
      });
    });
    it('서버에 알 수 없는 오류가 발생했을 경우', async () => {
      usersRepo.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.getUserProfile(1);
      expect(usersRepo.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: false, error: 'User Not Found!' });
    });
  });

  describe('editProfile', () => {
    const oldUser = {
      id: 1,
      email: 'bs@old.com',
      verified: true,
      password: 'test',
    };

    const editProfileArgs = {
      email: 'test@naver.com',
      password: '1234',
    };

    const newUser = {
      email: 'test@naver.com',
      id: 1,
      password: '1234',
      verified: false,
    };

    const newVerification = {
      code: 'code',
    };
    it('변경할 유저를 찾지 못했을 경우', async () => {
      usersRepo.findOneOrFail.mockRejectedValue(new Error());
      const { ok, error } = await service.editProfile(1, {
        email: oldUser.email,
        password: oldUser.password,
      });
      expect(usersRepo.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(ok).toEqual(false);
      expect(error).toEqual('User Not Found');
    });

    it('이메일 및 패스워드 변경 했을 경우', async () => {
      usersRepo.findOneOrFail.mockResolvedValue(oldUser);
      verifyRepo.create.mockReturnValue(newVerification);
      verifyRepo.save.mockResolvedValue(newVerification);

      const { ok, error } = await service.editProfile(1, editProfileArgs);

      expect(usersRepo.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepo.findOneOrFail).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
      expect(verifyRepo.create).toHaveBeenCalledTimes(1);
      expect(verifyRepo.create).toHaveBeenCalledWith({ user: newUser });
      expect(verifyRepo.save).toHaveBeenCalledTimes(1);
      expect(verifyRepo.save).toHaveBeenCalledWith(newVerification);

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newVerification.code,
      );
    });

    it('비밀번호가 변경 되었을 경우', async () => {
      const editProfilePwdArgs = {
        userId: 1,
        input: {
          password: 'new.password',
        },
      };
      usersRepo.findOneOrFail.mockResolvedValue({ password: 'old' });
      const { ok, error } = await service.editProfile(
        editProfilePwdArgs.userId,
        editProfilePwdArgs.input,
      );

      expect(usersRepo.save).toHaveBeenCalledTimes(1);
      expect(usersRepo.save).toHaveBeenCalledWith(editProfilePwdArgs.input);

      expect(ok).toEqual(true);
    });

    it('예외처리가 발생했을 경우', async () => {
      usersRepo.findOneOrFail.mockResolvedValue(oldUser);
      usersRepo.save.mockRejectedValue(new Error());
      const result = await service.editProfile(1, { email: 'test@naver.com' });
      expect(result).toEqual({
        error: '처리를 하는 도중에 오류가 발생하였습니다.',
        ok: false,
      });
    });
  });
  describe('verifyEmail', () => {
    it('email verification이 진행 되는 경우', async () => {
      const mockedVerification = {
        user: {
          verified: false,
        },
        id: 1,
      };
      verifyRepo.findOne.mockResolvedValue(mockedVerification);
      const result = await service.verifyEmail('code');

      expect(verifyRepo.findOne).toHaveBeenCalledTimes(1);
      expect(verifyRepo.findOne).toHaveBeenCalledWith(expect.any(Object));

      expect(usersRepo.save).toHaveBeenCalledTimes(1);
      expect(usersRepo.save).toHaveBeenCalledWith({ verified: true });

      expect(verifyRepo.delete).toHaveBeenCalledTimes(1);
      expect(verifyRepo.delete).toHaveBeenCalledWith(mockedVerification.id);

      expect(result).toEqual({ ok: true });
    });
    it('예외처리가 발생 했을 경우', async () => {
      verifyRepo.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail('code');
      expect(result).toEqual({
        error: 'Email 인증을 할 수가 없습니다.',
        ok: false,
      });
    });
    it('verification을 찾지 못할 경우', async () => {
      verifyRepo.findOne.mockResolvedValue(null);
      const result = await service.verifyEmail('code');
      expect(result).toEqual({
        ok: false,
        error: 'User Not Found.',
      });
    });
  });
});
