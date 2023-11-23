import { Module } from '@nestjs/common';
import { RestaurantResolver } from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantsService } from './restaurants.service';
import { Category } from './entities/category.entity';
import { CategoryCustomRepository } from './repository/category.repository';
import { RestaurantCategoryResolver } from './restaurants.category.resolver';
import { Dish } from './entities/dish.entity';
import { DishResolver } from './restaurant.dish.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category, Dish])],
  providers: [
    RestaurantsService,
    RestaurantResolver,
    RestaurantCategoryResolver,
    DishResolver,
    CategoryCustomRepository,
  ],
})
export class RestaurantsModule {}
