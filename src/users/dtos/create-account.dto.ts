import { ArgsType, ObjectType, OmitType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';

@ArgsType()
export class CreateAccountInput extends OmitType(
  User,
  [
    'createAt',
    'updateAt',
    'id',
    'hashPassword',
    'checkPassword',
    'verified',
    'restaurants',
  ],
  ArgsType,
) {}

@ObjectType()
export class CreateAccountOutput extends OutputBaseDto {}
