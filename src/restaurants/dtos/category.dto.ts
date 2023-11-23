import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { Category } from '../entities/category.entity';
import { IsString } from 'class-validator';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { Restaurant } from '../entities/restaurant.entity';

// Category를 통해 해당 Category에 속하는 Restaurants를 보여주는 기능을 구현 하기 위한 DTO

@ArgsType()
export class CategoryInput extends PaginationInput {
  @Field((type) => String)
  @IsString()
  slug: string;
}

@ObjectType()
export class CategoryOutput extends PaginationOutput {
  @Field((type) => Category, { nullable: true })
  category?: Category;

  @Field((type) => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
