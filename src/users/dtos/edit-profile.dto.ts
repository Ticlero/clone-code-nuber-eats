import { InputType, ObjectType, PartialType, PickType } from '@nestjs/graphql';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { User } from '../entities/user.entity';

@ObjectType()
export class EditProfileOuput extends OutputBaseDto {}

@InputType()
export class EditProfileInput extends PartialType(
  PickType(User, ['email', 'password'], InputType),
) {}
