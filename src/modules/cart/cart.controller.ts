import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateCartDto } from './dto/create-cart.dto';

@ApiTags('Cart Management')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}
  @Post('add')
  @ApiOperation({ summary: 'Add product to cart' })
  async addToCart(@CurrentUser() user: any, @Body() dto: CreateCartDto) {
    return this.cartService.addToCart(user.userId, dto.productId, dto.quantity);
  }

  @Get()
  async getCart(@CurrentUser() user: any) {
    return this.cartService.getCart(user.userId);
  }
}
