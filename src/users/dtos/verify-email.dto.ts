import { ArgsType, ObjectType, PickType } from '@nestjs/graphql';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { Verification } from '../entities/verification.entity';

@ObjectType()
export class VerifyEmailOutput extends OutputBaseDto {}

@ArgsType()
export class VerifyEmailInput extends PickType(
  Verification,
  ['code'],
  ArgsType,
) {}
