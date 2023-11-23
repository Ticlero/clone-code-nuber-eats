import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { Dish } from '../entities/dish.entity';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { IsNumber } from 'class-validator';

@InputType()
export class CreateDishInput extends PickType(Dish, [
  'name',
  'price',
  'description',
  'options',
]) {
  //레스토랑 주인이 Dish를 생성할 때 해당 레스토랑이 어떤 것인지 알려줘야 하기 때문에 필요한 필드
  @Field((type) => Int)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class CreateDishOutput extends OutputBaseDto {}
