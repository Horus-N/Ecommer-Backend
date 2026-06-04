import { PrismaService } from '@/prisma/prisma.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRound = 10;
    return await bcrypt.hash(password, saltRound);
  }

  /**
   * create a new user (public register)
   */
  async createUser(data: any) {
    //check email existed or not
    const existedUser = await this.prismaService.user.findUnique({
      where: {
        email: data.email,
      },
    });
    // throw standard 409 confilect err
    if (existedUser) throw new ConflictException('Email already existed!');
    const hashedPassword = await this.hashPassword(data.password);

    // process record insert
    const user = await this.prismaService.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find one User by email (service for login feature later)
   */

  async findUserByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user)
      throw new NotFoundException('User not found with this email: ' + email);
    return user;
  }

  /**
   * find onw user by id (service for user profile feature)
   */

  async findUserById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (!user)
      throw new NotFoundException('User not found with this id: ' + id);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
