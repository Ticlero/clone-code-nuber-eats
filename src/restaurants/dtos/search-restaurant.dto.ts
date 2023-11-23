import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { Restaurant } from '../entities/restaurant.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { IsString } from 'class-validator';

//NestJS에서 DB에 존재하는 특정 필드의 값을 keyword를 통해 search하는 방법

//restaurant이 하나가 아니라 여러개일 가능성이 있으므로 paginationInput을 상속받는다
@ArgsType()
export class SearchRestaurantInput extends PaginationInput {
  @Field((type) => String)
  @IsString()
  query: string;
}

@ObjectType()
export class SearchRestaurantOutput extends PaginationOutput {
  @Field((type) => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
