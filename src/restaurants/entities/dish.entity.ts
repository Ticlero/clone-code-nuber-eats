import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsArray, IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
class DishChoice {
  @Field((type) => String)
  @Column()
  @IsString()
  name: string;

  @Field((type) => Number, { nullable: true })
  @Column()
  @IsNumber()
  extra?: number;
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
class DishOption {
  @Field((type) => String)
  @IsString()
  name: string;

  @Field((type) => [DishChoice], { nullable: true })
  @IsArray({})
  choices?: DishChoice[];

  @Field((type) => Number, { nullable: true })
  @IsNumber()
  extra?: number;
}

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Field((type) => String)
  @Column()
  @IsString()
  name: string;

  @Field((type) => Number)
  @Column()
  @IsNumber()
  price: number;

  // Image는 보통 URL로 나타내기 때문에 String으로 한다.
  @Field((type) => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  photo?: string;

  @Field((type) => String)
  @Column()
  @IsString()
  @Length(5, 140)
  description: string;

  @Field((type) => Restaurant)
  @ManyToOne((type) => Restaurant, (restaurant) => restaurant.menu, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  @Field((type) => [DishOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  @IsArray()
  options?: DishOption[];
}
