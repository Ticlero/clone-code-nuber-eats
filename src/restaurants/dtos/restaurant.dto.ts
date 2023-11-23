import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { Restaurant } from '../entities/restaurant.entity';
import { IsNumber } from 'class-validator';

@ArgsType()
export class RestaurantInput {
  @Field((type) => Int)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class RestaurantOutput extends OutputBaseDto {
  @Field((type) => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}
