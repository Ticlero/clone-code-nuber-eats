import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';

@InputType()
export class DeleteDishInput {
  @Field((type) => Number)
  @IsNumber()
  dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends OutputBaseDto {}
