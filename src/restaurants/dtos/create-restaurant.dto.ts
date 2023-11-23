import {
  Field,
  InputType,
  ObjectType,
  OmitType,
  PickType,
} from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { IsString } from 'class-validator';

// @ArgsType()
@InputType()
export class CreateRestaurantInput extends PickType(
  Restaurant,
  ['name', 'coverImage', 'address'],
  InputType,
) {
  @Field((type) => String)
  @IsString()
  categoryName: string;
}

@ObjectType()
export class CreateRestaurantOutput extends OutputBaseDto {}

//InputType은 여러개의 정의된 필드를 하나의 Object로 만든다고 생각하면 된다. argument로써 graphql 에 전달하기 위한 용도
//ArgsType은 정의된 필드를 argument로 분리된 값으로 전달 가능.
