import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { OutputBaseDto } from './output.base.dto';
import { IsNumber } from 'class-validator';

@ArgsType()
export class PaginationInput {
  @Field((type) => Int, { defaultValue: 1 })
  @IsNumber()
  page: number;
}

@ObjectType()
export class PaginationOutput extends OutputBaseDto {
  @Field((type) => Int, { nullable: true })
  totalPages?: number;

  @Field((type) => Int, { nullable: true })
  totalResults?: number;
}
