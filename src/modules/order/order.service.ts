import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: string, address: string) {
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
    return this.prisma.$transaction(async (tx) => {
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
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
