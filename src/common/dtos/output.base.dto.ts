import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OutputBaseDto {
  @Field((type) => String, { nullable: true })
  error?: string | undefined;
  @Field((type) => Boolean)
  ok: boolean;
}
