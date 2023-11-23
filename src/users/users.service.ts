import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';

import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';

import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOuput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifiRepo: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async findById(
    id: number,
  ): Promise<{ ok: boolean; user: User; error?: string }> | null {
    try {
      const result = await this.userRepo.findOneOrFail({
        where: {
          id: id,
        },
      });
      return {
        ok: true,
        user: result,
      };
    } catch (e) {
      return {
        ok: false,
        user: null,
        error: `해당하는 유저를 찾을 수 없습니다. id=[${id}]`,
      };
    }
  }

  async getUserProfile(userId: number): Promise<UserProfileOutput> {
    const { ok, user } = await this.findById(userId);
    if (!ok) {
      return {
        ok: false,
        error: 'User Not Found!',
      };
    }
    return {
      user,
      ok: true,
    };
  }

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    //check new user
    //create user & hash the password
    try {
      const exists = await this.userRepo.findOneBy({ email });

      if (exists) {
        return { ok: false, error: '이미 존재하는 아이디' };
      }

      const user = await this.userRepo.save(
        this.userRepo.create({ email, password, role }),
      );
      const verification = await this.verifiRepo.save(
        this.verifiRepo.create({ user }),
      );
      this.mailService.sendVerificationEmail(user.email, verification.code);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: '계정을 생성할 수 없습니다.' };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    //find the user with the email
    // check if ther password is correct
    //make a jwt and give it to the user

    try {
      const user = await this.userRepo.findOne({
        where: { email },
        select: ['password', 'id', 'role'],
      });
      if (!user) {
        return {
          ok: false,
          error: '유저를 찾을 수 없습니다.',
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: '잘못된 비밀번호',
        };
      }

      const token = this.jwtService.sign({
        id: user.id,
        role: user.role,
      });

      return {
        ok: true,
        token,
      };
    } catch (e) {
      return {
        ok: false,
        error: '서버에 문제가 발생하였습니다.',
      };
    }
  }

  async editProfile(
    userId: number,
    editProfileInput: EditProfileInput,
  ): Promise<EditProfileOuput> {
    try {
      const { ok, user } = await this.findById(userId);
      const { email, password } = editProfileInput;

      if (!ok) {
        return {
          ok: false,
          error: 'User Not Found',
        };
      }

      if (email) {
        const duplicationCheck = await this.userRepo.findOneBy({ email });

        if (duplicationCheck) {
          return {
            ok: false,
            error: '이미 존하는 email입니다.',
          };
        }

        user.email = email;
        this.verifiRepo.delete({ user: { id: user.id } });
        user.verified = false;
        const verification = await this.verifiRepo.save(
          this.verifiRepo.create({ user }),
        );

        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) {
        user.password = password;
      }
      // return await this.userRepo.update({ id: userId }, { ...user });
      await this.userRepo.save(user);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: '처리를 하는 도중에 오류가 발생하였습니다.',
      };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifiRepo.findOne({
        where: {
          code,
        },
        relations: ['user'],
      });
      if (verification) {
        verification.user.verified = true;
        await this.userRepo.save(verification.user);
        await this.verifiRepo.delete(verification.id);
        return {
          ok: true,
        };
      }

      return {
        ok: false,
        error: 'Verification Not Found.',
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Email 인증을 할 수가 없습니다.',
      };
    }
  }
}
