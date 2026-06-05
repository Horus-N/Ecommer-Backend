import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@ApiTags('Product Managerment')
@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }
  @Get('list')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get all product' })
  async findAllProduct() {
    return this.productService.findAll();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật sản phẩm & Xóa cache lỗi thời' })
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const updatedProduct = await this.productService.update(id, updateDto);

    // Xử lý bài toán của cậu: Dữ liệu thay đổi -> Xóa ngay key cache của API findAll
    // Trong NestJS, key mặc định của CacheInterceptor chính là đường dẫn URL: '/api/products'
    await this.cacheManager.del('/api/products');

    return updatedProduct;
  }
}
