import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log('====================================');
    console.log('request curent, ', request);
    console.log('====================================');
    console.log('request data, ', data);
    return request.user;
  },
);
