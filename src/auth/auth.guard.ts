import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { AllowedRoles } from './role.decorator';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );

    // const testReflector = Reflect.getMetadata('roles', context.getHandler()); // metadata의 정보를 가져오는 다른 방법

    // 메타데이터가 없으면 public resolver로 정의했기 때문에, 서비스를 허용해야 한다.
    if (!roles) {
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user: User = gqlContext['user'];
    if (!user) {
      return false;
    }

    if (roles.includes('Any')) {
      return true;
    }

    //각 resolver에 설정된 role과 user의 role이 맞지 않을 경우, 접근 금지
    return roles.includes(user.role);
  }
}
