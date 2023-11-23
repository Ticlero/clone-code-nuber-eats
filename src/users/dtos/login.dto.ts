import { ArgsType, Field, ObjectType, PickType } from '@nestjs/graphql';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { User } from '../entities/user.entity';

@ArgsType()
export class LoginInput extends PickType(
  User,
  ['email', 'password'],
  ArgsType,
) {}

@ObjectType()
export class LoginOutput extends OutputBaseDto {
  @Field((type) => String, { nullable: true })
  token?: string;
}
