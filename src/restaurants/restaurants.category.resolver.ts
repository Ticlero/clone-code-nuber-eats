import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Category } from './entities/category.entity';
import { RestaurantsService } from './restaurants.service';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';

@Resolver((of) => Category)
export class RestaurantCategoryResolver {
  constructor(private readonly restaurantService: RestaurantsService) {}

  @Query((type) => AllCategoriesOutput)
  allCatetories() {
    return this.restaurantService.allCategories();
  }

  /*
    사용자가 홈화면에 들어오면 몇 개의 category가 있고,
    category에 해당하는 restaurant가 몇 개인지도 보여줄 수 있는 기능을 구현할 수 있다.
  */

  // ResolveField는 매 Request마다 계산된 field를 만들어준다.
  @ResolveField('countRestaurant', (type) => Number)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantService.countRestaurants(category);
  }

  @Query((type) => CategoryOutput)
  category(@Args() categoryInput: CategoryInput): Promise<CategoryOutput> {
    return this.restaurantService.findCategoryBySlug(categoryInput);
  }
}
