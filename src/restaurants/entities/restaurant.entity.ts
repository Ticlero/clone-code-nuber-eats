import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Category } from './category.entity';
import { User } from 'src/users/entities/user.entity';
import { Dish } from './dish.entity';
import { Order } from 'src/orders/entities/order.entity';
//@InputType({ isAbstract: true }) //graphql은 유일한 타입을 갖길 원하는데, isAbstract 옵션을 사용하면 스키마에는 포함되지 않는 타입을 추가 할 수있도록 확장 시켜준다.
@InputType('RestaurantInputType')
@ObjectType() //GraphQL의 typeDef를 정의 하는 데코레이터이자 자동으로 스키마를 빌드하기 위해 사용됨
@Entity() // Entity 데코레이터를 이용하면 TypeORM이 DB 테이블에 이 entity를 저장한다.
export class Restaurant extends CoreEntity {
  @Field((type) => String)
  @Column()
  @IsString()
  name: string;

  @Field((type) => String)
  @Column()
  @IsString()
  address: string;

  @Field((type) => String)
  @Column()
  @IsString()
  coverImage: string;

  @Field((type) => Category, { nullable: true })
  @ManyToOne((type) => Category, (category) => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category: Category;

  @Field((type) => User)
  @ManyToOne((type) => User, (user) => user.restaurants, {
    onDelete: 'CASCADE',
  })
  owner: User;

  //매개변수로는 객체를 받고, 어떤 id를 로드해야하는지 작성
  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @Field((type) => [Dish])
  @OneToMany((type) => Dish, (dish) => dish.restaurant)
  menu: Dish[];

  @Field((type) => [Order])
  @OneToMany((type) => Order, (order) => order.restaurant)
  orders: Order[];
}
