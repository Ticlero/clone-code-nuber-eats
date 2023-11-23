import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';

@InputType()
export class DeleteRestaurantInput {
  @Field((type) => Number)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class DeleteRestaurantOutput extends OutputBaseDto {}
