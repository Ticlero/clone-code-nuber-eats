import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Dish } from './entities/dish.entity';
import { RestaurantsService } from './restaurants.service';
import { Query } from '@nestjs/common';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish';
import { Role } from 'src/auth/role.decorator';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';

@Resolver((of) => Dish)
export class DishResolver {
  constructor(private readonly restaurantService: RestaurantsService) {}
  // - Create Dish
  // - Read Dish
  // - Update Dish
  // - Delete Dish

  @Role(['Owner'])
  @Mutation((type) => CreateDishOutput)
  createDish(
    @AuthUser() owner: User,
    @Args('input') createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return this.restaurantService.createDish(owner, createDishInput);
  }

  @Role(['Owner'])
  @Mutation((type) => EditDishOutput)
  editDish(
    @AuthUser() owner,
    @Args('input') editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    return this.restaurantService.editDish(owner, editDishInput);
  }

  @Role(['Owner'])
  @Mutation((type) => DeleteDishOutput)
  deleteDish(
    @AuthUser() owner,
    @Args('input') deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    return this.restaurantService.deleteDish(owner, deleteDishInput);
  }
}
