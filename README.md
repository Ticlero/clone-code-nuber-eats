# Nuber Eats

The Backend of Nuber Eats Clone

## User Entity:

-id
-createdAt
-updatedAt

-email
-password
-role(client | owner | delivery)

### User CRUD:

-Create Account
-Log In
-See Profile
-Edit Profile
-Verify Email

## Restaurant Model

- name
- category - foreign key
- address
- coverImage

### Restaurant Resolver & Service

- Edit Restaurant - complete
- Delete Restaurant - complete

- See Categories Count - complete

- See Restaurants by Category (Pagination)
- See Restaurants (Pagination)
- See Restaurant

## Dish Entity & Module & Resolver & Service ( MRS )

- Create Dish
  - Dish는 가격, 이미지, 세부사항, 용량 등의 특성을 가질 것이다.
    - id
    - create at
    - update at
    - name
    - ...
- Edit Dish
- Delete Dish

## Orders

- Order CRUD
- Order Subscription ( Owner, Customer, Delivery )

## Payments (CRON)
