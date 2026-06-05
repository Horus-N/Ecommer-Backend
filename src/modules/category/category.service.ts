import { PrismaService } from '@/prisma/prisma.service';
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(dto: CreateCategoryDto) {
    const existing = await this.prismaService.category.findUnique({
      where: {
        name: dto.name,
      },
    });
    if (existing) throw new ConflictException('Category name already exists');
    return this.prismaService.category.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prismaService.category.findMany({
      // count category has many products
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }
}
