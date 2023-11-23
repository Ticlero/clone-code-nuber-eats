import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
  email: 'cbiscuit@naver.com',
  password: '1234',
};

jest.mock('node-fetch', () => {
  return {
    fetch: jest.fn(),
  };
});

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken: string;
  let usersRepo: Repository<User>;
  let verifyRepo: Repository<Verification>;

  const baseTest = () => {
    return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  };

  const publicTest = (query: string) => {
    return baseTest().send({ query });
  };

  const privateTest = (query: string) => {
    return baseTest().set('X-JWT', jwtToken).send({ query });
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    dataSource = module.get<DataSource>(DataSource);
    usersRepo = module.get<Repository<User>>(getRepositoryToken(User));
    verifyRepo = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    // const dataSource: DataSource = new DataSource({
    //   type: 'postgres',
    //   host: process.env.DB_HOST,
    //   port: +process.env.DB_PORT,
    //   username: process.env.USERNAME,
    //   password: process.env.PASSWORD,
    //   database: process.env.DB_NAME,
    // });

    // const conection: DataSource = await dataSource.initialize();
    // await conection.dropDatabase(); // 데이터베이스 삭제
    // await conection.destroy(); // 연결 해제

    await dataSource.dropDatabase();
    app.close();
  });

  //E2E 테스트에서는 GraphQL의 스키마를 테스트한다.
  describe('createAccount', () => {
    it('should createAccount', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation{
            createAccount(
              email: "${testUser.email}",
              password:"${testUser.password}",
              role:Client,
            ){
              ok,
              error
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exists', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation{
            createAccount(
              email: "${testUser.email}",
              password:"${testUser.password}",
              role:Client,
            ){
              ok,
              error
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toBe(
            '이미 존재하는 아이디',
          );
        });
    });
  });
  describe('login', () => {
    it('should login with correct credentials', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation{
              login(
                email:"${testUser.email}",
                password:"${testUser.password}"
                ){
                  ok
                  error
                  token
                }
            }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          jwtToken = login.token;

          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
        });
    });
    it('should not be able to login with wrong credentials', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation{
              login(
                email:"${testUser.email}",
                password:"4321"
                ){
                  ok
                  error
                  token
                }
            }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;

          expect(login.ok).toBe(false);
          expect(login.error).toBe('잘못된 비밀번호');
          expect(login.token).toBe(null);
        });
    });
  });
  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepo.find();
      userId = user.id;
    });
    it(`should see a users's profile`, () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
            {
              userProfile(userId:${userId}){
                ok
                error
                user{
                  id
                }
              }
            }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;

          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });
    it(`should not find a users's profile`, () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
            {
              userProfile(userId:666){
                ok
                error
                user{
                  id
                }
              }
            }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;

          expect(ok).toBe(false);
          expect(error).toBe('User Not Found!');
          expect(user).toBe(null);
        });
    });
  });
  describe('me', () => {
    it('should find my profile', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
            {
              me{
                email
              }
            }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;

          expect(email).toBe(testUser.email);
        });
    });
    it('should not allow logged out user', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            {
              me{
                email
              }
            }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: { errors },
          } = res;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });
  describe('editProfile', () => {
    const changedEmail = 'cbiscuit92@naver.com';
    it('should change email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          mutation{
            editProfile(input:{
              email:"${changedEmail}",
            })
            {
              ok,
              error
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.editProfile;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        })
        .then(() => {
          return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .set('X-JWT', jwtToken)
            .send({
              query: `
            {
              me{
                email
              }
            }
        `,
            })
            .expect(200)
            .expect((res) => {
              const {
                body: {
                  data: {
                    me: { email },
                  },
                },
              } = res;

              expect(email).toBe(changedEmail);
            });
        });
    });
    it('duplication email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          mutation{
            editProfile(input:{
              email:"${changedEmail}",
            })
            {
              ok,
              error
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.editProfile;
          expect(ok).toBe(false);
          expect(error).toBe('이미 존하는 email입니다.');
        });
    });

    it('should change password', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          mutation{
            editProfile(input:{
              password: "test",
            })
            {
              ok,
              error
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.editProfile;

          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
  });

  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verifyRepo.find();
      verificationCode = verification.code;
    });
    it('should verify Email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation{
            verifyEmail(code:"${verificationCode}"){
              error,
              ok
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.verifyEmail;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('should  fali on wrong verification code not found', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation{
            verifyEmail(code:"xxx"){
              error,
              ok
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.verifyEmail;
          expect(ok).toBe(false);
          expect(error).toBe('Verification Not Found.');
        });
    });
  });
});
