import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Order Management')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  @ApiOperation({
    summary: 'Tiến hành đặt hàng từ giỏ hàng hiện tại (Xử lý Transaction)',
  })
  async checkout(@CurrentUser() user: any, @Body() body: CreateOrderDto) {
    console.log('address, ', body.address);

    if (!body.address)
      throw new BadRequestException('Địa chỉ giao hàng không được để trống!');
    return this.orderService.createOrder(user.userId, body.address);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách lịch sử đơn hàng của tôi' })
  async getMyOrders(@CurrentUser() user: any) {
    return this.orderService.getMyOrders(user.userId);
  }
}
