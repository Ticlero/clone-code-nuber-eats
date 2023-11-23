import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { User } from '../entities/user.entity';
import { IsNumber } from 'class-validator';

@ArgsType()
export class UserProfileInput {
  @Field((type) => Number)
  @IsNumber()
  userId: number;
}

@ObjectType()
export class UserProfileOutput extends OutputBaseDto {
  @Field((type) => User, { nullable: true })
  user?: User;
}
