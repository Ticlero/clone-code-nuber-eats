import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { Category } from '../entities/category.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { IsArray, IsObject } from 'class-validator';

@ObjectType()
export class AllCategoriesOutput extends OutputBaseDto {
  @Field((type) => [Category], { nullable: true })
  @IsObject({ each: true })
  categories?: Category[];
}
