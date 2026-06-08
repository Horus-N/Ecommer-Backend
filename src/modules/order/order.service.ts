import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { sortObject } from '@/common/utils/vnpay.util';
const moment = require('moment');
import * as qs from 'qs'; // npm i qs
import * as crypto from 'crypto';
import { OrderStatus } from '@/generated/prisma/enums';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async createOrder(req: any, userId: string, address: string) {
    // 1. Lấy giỏ hàng hiện tại của User

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException(
        'Giỏ hàng của bạn đang trống, không thể đặt hàng!',
      );
    }

    // Tính tổng tiền đơn hàng
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    // 2. Kích hoạt ACID Transaction của Prisma
    const order = await this.prisma.$transaction(async (tx) => {
      // Bước A: Tạo bản ghi Đơn hàng tổng
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          address,
        },
      });

      // Bước B: Duyệt qua từng item trong giỏ để kiểm tra kho và trừ stock
      for (const item of cart.items) {
        // Cú pháp tối ưu: Trừ kho trực tiếp bằng điều kiện và câu lệnh UPDATE nguyên tử (Atomic Update)
        // Nếu số lượng yêu cầu lớn hơn stock hiện tại, Prisma sẽ không tìm thấy dòng thỏa mãn và trả về lỗi
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm ${product?.name || ''} đã hết hàng hoặc không đủ số lượng trong kho!`,
          );
        }

        // Cập nhật giảm số lượng trong kho
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        // Bước C: Tạo chi tiết đơn hàng (OrderItem)
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price, // Giá chốt tại thời điểm mua
          },
        });
      }

      // Bước D: Xóa sạch giỏ hàng sau khi đã đặt hàng thành công
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await this.mailService.queueOrderConfirmationEmail(
        user.email,
        order.id,
        order.totalAmount,
      );
    }
    const paymentUrl = this.createVnPayUrl(req, order.id, order.totalAmount);

    return {
      message:
        'Khởi tạo đơn hàng thành công. Vui lòng chuyển hướng sang cổng thanh toán!',
      orderId: order.id,
      paymentUrl, // Khách click link này để sang VNPay nhập thẻ test
    };
  }
  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
  }
  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  //Create VnpayURL
  createVnPayUrl(req: any, orderId: string, amount: number): string {
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');

    // Thu thập địa chỉ IP của Client thực hiện request
    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    let vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId; // Mã đơn hàng của hệ thống chúng ta
    vnp_Params['vnp_OrderInfo'] = `Thanh toan don hang #${orderId}`;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100; // VNPay yêu cầu nhân 100 để bỏ phần thập phân
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sắp xếp các tham số theo chuẩn mã hóa VNPay
    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

    return vnpUrl;
  }
}
