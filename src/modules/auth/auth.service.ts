import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * register a new account across the user service
   */

  async register(dto: RegisterDto) {
    return this.userService.createUser(dto);
  }

  /**
   * login: check info and access token reposonse
   */

  async login(dto: LoginDto) {
    const user = await this.userService.findUserByEmail(dto.email);
    const isPassowrdMatch = await bcrypt.compare(dto.password, user.password);

    if (!isPassowrdMatch)
      throw new UnauthorizedException(
        'Password is not correct, please try again!',
      );
    const { password, ...userWithoutPassword } = user;
    const payload = { sub: userWithoutPassword.id, ...userWithoutPassword };
    const accessToken = this.jwtService.signAsync(payload);
    return {
      accessToken,
      //   user: userWithoutPassword,
    };
  }
}
