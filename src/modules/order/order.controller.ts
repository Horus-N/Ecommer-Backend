import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
  Query,
  Res,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import * as qs from 'qs';
import { sortObject } from '@/common/utils/vnpay.util';
import * as crypto from 'crypto';
import { OrderStatus } from '@/generated/prisma/enums';

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
  async checkout(
    @Req() req: any,
    @CurrentUser() user: any,
    @Body() body: CreateOrderDto,
  ) {
    console.log('address, ', body.address);

    if (!body.address)
      throw new BadRequestException('Địa chỉ giao hàng không được để trống!');
    return this.orderService.createOrder(req, user.userId, body.address);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách lịch sử đơn hàng của tôi' })
  async getMyOrders(@CurrentUser() user: any) {
    return this.orderService.getMyOrders(user.userId);
  }

  @Get('vnpay-ipn')
  @ApiOperation({
    summary: 'Nơi VNPay gọi ngầm về để chốt trạng thái hóa đơn (IPN Endpoint)',
  })
  async vnpayIpn(@Query() query: any, @Res() res: any) {
    try {
      let vnp_Params = query;
      const secureHash = vnp_Params['vnp_SecureHash'];

      // Loại bỏ các tham số băm ra khỏi object trước khi Verify chéo
      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      vnp_Params = sortObject(vnp_Params);
      const secretKey = process.env.VNP_HASH_SECRET;
      const signData = qs.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      // 1. Kiểm tra chữ ký an toàn (Anti-tampering)
      if (secureHash !== signed) {
        return res
          .status(HttpStatus.OK)
          .json({ RspCode: '97', Message: 'Fail checksum' });
      }

      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode']; // 00 tức là thanh toán thành công thành công

      // 2. Tìm đơn hàng trong DB của cậu
      const order = await this.orderService.findOne(orderId); // Tự viết hàm findOne nhé Tùng
      if (!order) {
        return res
          .status(HttpStatus.OK)
          .json({ RspCode: '01', Message: 'Order not found' });
      }

      // 3. Kiểm tra xem đơn hàng đã được cập nhật trước đó chưa (Tránh xử lý trùng - Idempotency)
      if (order.status !== OrderStatus.PENDING) {
        return res
          .status(HttpStatus.OK)
          .json({ RspCode: '02', Message: 'Order already confirmed' });
      }

      // 4. Kiểm tra số tiền có khớp không (Chống tấn công thay đổi tiền tệ từ client)
      const vnpAmount = Number(vnp_Params['vnp_Amount']) / 100;
      if (order.totalAmount !== vnpAmount) {
        return res
          .status(HttpStatus.OK)
          .json({ RspCode: '04', Message: 'Invalid amount' });
      }

      // 5. Hợp lệ hoàn toàn -> Tiến hành cập nhật trạng thái đơn hàng
      if (responseCode === '00') {
        await this.orderService.updateStatus(orderId, OrderStatus.PROCESSING); // Thanh toán ngon -> Sang trạng thái xử lý/giao hàng
        // Cậu có thể đẩy thêm 1 Job bắn mail: "Đã nhận được tiền thanh toán" vào BullMQ tại đây nếu thích!
      } else {
        await this.orderService.updateStatus(orderId, OrderStatus.CANCELLED); // Thanh toán lỗi hoặc khách bấm hủy bên VNPay
      }

      // Trả về đúng định dạng JSON mà VNPay yêu cầu để xác nhận hoàn tất
      return res
        .status(HttpStatus.OK)
        .json({ RspCode: '00', Message: 'Confirm success' });
    } catch (error) {
      return res
        .status(HttpStatus.OK)
        .json({ RspCode: '99', Message: 'Unknown error' });
    }
  }
}
