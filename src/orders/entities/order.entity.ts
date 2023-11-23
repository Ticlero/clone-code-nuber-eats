import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  // typescript -> graphql -> column, relationship ( TypeORM ) 순으로 코드 작성
  // Order is ManyToOne. User is OneToMany.
  // 주문 개체는 User가 하나이고, User는 여러 주문을 가질 수 있다.
  @Field((type) => User, { nullable: true })
  @ManyToOne((type) => User, (user) => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  customer?: User;

  // 주문을 하자마자 배달원을 배정 받지 못하기 때문에 nullable로 설정
  @Field((type) => User, { nullable: true })
  @ManyToOne((type) => User, (user) => user.rides, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  driver?: User;

  @Field((type) => Restaurant)
  @ManyToOne((type) => Restaurant, (restaurant) => restaurant.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  restaurant: Restaurant;

  // 많은 사람들이 같은 음식을 주문 할 수 있으니 하나의 음식은 여러개의 order를 가질 수 있다.
  // JoinTable은 ManyToMany 관계에서 필수적으로 사용된다. 이 데코레이터는 소유(owning)측에서 사용되어야 한다.
  // Dish에서는 어떤 order에 포함 되는지 알 수 없다.
  // 정리하면 data에 어떻게 접근하는지에 따라 달라진다.
  @Field((type) => [Dish])
  @ManyToMany((type) => Dish)
  @JoinTable()
  dishes: Dish[];

  @Column()
  @Field((type) => Number)
  total: number;

  @Column({ type: 'enum', enum: OrderStatus })
  @Field((type) => OrderStatus)
  status: OrderStatus;
}
