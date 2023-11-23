import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { ILike, Like, Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { User } from 'src/users/entities/user.entity';
import { Category } from './entities/category.entity';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { CategoryCustomRepository } from './repository/category.repository';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { OutputBaseDto } from 'src/common/dtos/output.base.dto';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish';
import { Dish } from './entities/dish.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';

const TAKE_PAGE = 25;

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    private readonly categoryCustomRepo: CategoryCustomRepository,
    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,
  ) {}
  // @InjectRepository(Category)
  // private readonly categoryRepo: Repository<Category>,

  // async getOrCreateCategory(name: string): Promise<Category> {
  //   const categoryName = name.trim().toLowerCase();
  //   const categorySlug = categoryName.replace(/ /g, '-');
  //   let category = await this.categoryRepo.findOne({
  //     where: { slug: categorySlug },
  //   });
  //   if (!category) {
  //     category = await this.categoryRepo.save(
  //       this.categoryRepo.create({ slug: categorySlug, name: categoryName }),
  //     );
  //   }
  //   return category;
  // }

  private async checkOwner(
    owner: User,
    restaurantId: number,
  ): Promise<OutputBaseDto> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: restaurantId },
      loadRelationIds: true,
    });
    // loadRelationIds은 relation obejct를 가져오지 않고 ID만 가져온다.
    // relation: ['owner']를 하게 되면 해당 object까지 load하는데 이는 DB에 부하를 준다.
    if (!restaurant) {
      return {
        ok: false,
        error: 'Restaurant not Found!',
      };
    }

    if (owner.id !== restaurant.ownerId) {
      return {
        ok: false,
        error: '해당 레스토랑을 수정할 권한이 없습니다.',
      };
    }

    return {
      ok: true,
    };
  }
  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurantRepo.create(createRestaurantInput);
      newRestaurant.owner = owner;

      const category = await this.categoryCustomRepo.getOrCreateCategory(
        createRestaurantInput.categoryName,
      );

      newRestaurant.category = category;
      await this.restaurantRepo.save(newRestaurant);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Restaurant를 생성할 수 없습니다.',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    //레스토랑을 수정하고 싶은 사람이 owner인지 확인
    try {
      const { ok, error } = await this.checkOwner(
        owner,
        editRestaurantInput.restaurantId,
      );

      if (!ok) {
        return {
          ok,
          error,
        };
      }

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categoryCustomRepo.getOrCreateCategory(
          editRestaurantInput.categoryName,
        );
      }
      //업데이트를 하고 싶을 때는 배열을 넣는다. save에서는 id를 넣지 않으면 새로운 entity를 생성하기 때문에 id를 넣어 줘야한다.
      console.log(editRestaurantInput);
      await this.restaurantRepo.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    const restaurantId = deleteRestaurantInput.restaurantId;
    try {
      const { ok, error } = await this.checkOwner(owner, restaurantId);

      if (!ok) {
        return {
          ok,
          error,
        };
      }

      await this.restaurantRepo.delete(restaurantId);

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could not delete restaurant',
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categoryCustomRepo.getAllCategories();
      return {
        ok: true,
        categories,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could not load categories',
      };
    }
  }

  async countRestaurants(category: Category) {
    return await this.restaurantRepo.count({
      where: { category: { id: category.id } },
    });
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categoryCustomRepo.getFindOne({
        where: { slug },
      });
      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
        };
      }
      const restaurants = await this.restaurantRepo.find({
        where: {
          category: { id: category.id },
        },
        take: TAKE_PAGE,
        skip: (page - 1) * TAKE_PAGE,
      });
      const totalResult = await this.countRestaurants(category);
      return {
        ok: true,
        category,
        restaurants,
        totalPages: Math.ceil(totalResult / TAKE_PAGE),
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could not load categoy',
      };
    }
  }

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] =
        await this.restaurantRepo.findAndCount({
          take: TAKE_PAGE,
          skip: (page - 1) * TAKE_PAGE,
        });
      return {
        ok: true,
        result: restaurants,
        totalPages: Math.ceil(totalResults / TAKE_PAGE),
        totalResults,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could not load restaurans',
      };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      //레스토랑을 조회할 때, 메뉴도 전부 불러올 수 있도록 한다.
      const restaurant = await this.restaurantRepo.findOne({
        where: { id: restaurantId },
        relations: ['menu'],
      });

      if (!restaurant) {
        return {
          ok: false,
          error: `Restaurant not found by id (id = ${restaurantId})`,
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch (e) {
      return {
        ok: false,
        error: ' Could not find restaurant',
      };
    }
  }

  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] =
        await this.restaurantRepo.findAndCount({
          where: {
            name: ILike(`%${query}%`),
          },
          skip: (page - 1) * TAKE_PAGE,
          take: TAKE_PAGE,
        });

      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / TAKE_PAGE),
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could not search for restaurants',
      };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      //1. restaurant를 찾는다
      //2. owner와 찾은 restaurant의 owner가 같은지 확인
      //3. dish를 생성하고 restaurant에 dish를 추가
      const restaurant = await this.restaurantRepo.findOne({
        where: { id: createDishInput.restaurantId },
      });

      if (!restaurant) {
        return {
          ok: false,
          error: '일치하는 레스토랑 정보가 없습니다.',
        };
      }

      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: '접근 권한이 없습니다.',
        };
      }

      const dish = await this.dishRepo.save(
        this.dishRepo.create({
          ...createDishInput,
          restaurant,
        }),
      );

      console.log(dish);

      return {
        ok: true,
      };
    } catch (e) {
      console.log(e);
      return {
        ok: false,
        error: 'Could not create dish.',
      };
    }
  }

  // { name, options, ... }: EditDishInput 이런 방법으로 하게 되면, 수정 하지 않은 필드값은 undefined로 나타나게 되어 코드가 복잡해진다.
  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      // const restuarant = await this.restaurantRepo.findOne({where:{id: owner.}})
      const dish = await this.dishRepo.findOne({
        where: { id: editDishInput.dishId },
        relations: ['restaurant'],
      });

      if (!dish) {
        return {
          ok: false,
          error: '수정하려는 음식이 존재하지 않습니다.',
        };
      }

      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: '수정할 권한이 없습니다.',
        };
      }
      await this.dishRepo.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: '정보를 변경 할 수 없습니다.',
      };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishRepo.findOne({
        where: { id: dishId },
        relations: ['restaurant'],
      });

      if (!dish) {
        return {
          ok: false,
          error: '삭제하려는 음식이 이미 존재하지 않습니다.',
        };
      }

      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: '삭제할 권한이 없습니다.',
        };
      }

      await this.dishRepo.delete(dishId);

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: '삭제할 수 없습니다.',
      };
    }
  }
}
