import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { Dish } from '../entities/dish.entity';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { IsNumber } from 'class-validator';

@InputType()
export class EditDishInput extends PickType(PartialType(Dish), [
  'name',
  'options',
  'price',
  'photo',
  'description',
]) {
  @Field((type) => Number)
  @IsNumber()
  dishId: number;
}

@ObjectType()
export class EditDishOutput extends OutputBaseDto {}
