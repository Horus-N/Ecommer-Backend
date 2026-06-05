import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(dto: CreateProductDto) {
    return this.prismaService.product.create({
      data: dto,
    });
  }

  async update(id: string, dto: CreateProductDto) {
    return this.prismaService.product.update({
      where: { id },
      data: dto,
    });
  }

  async findAll() {
    console.log('====================================');
    console.log('miss redis');
    console.log('====================================');
    return this.prismaService.product.findMany({
      include: {
        category: true,
      },
    });
  }
}
