import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantInput } from './create-restaurant.dto';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { IsNumber } from 'class-validator';

@InputType()
export class EditRestaurantInput extends PartialType(CreateRestaurantInput) {
  @Field((type) => Number)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class EditRestaurantOutput extends OutputBaseDto {}
