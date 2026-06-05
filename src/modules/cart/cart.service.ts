import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class CartService {
  constructor(private readonly prismaService: PrismaService) {}

  async addToCart(userId: string, productId: string, quantity: number) {
    const product = await this.prismaService.product.findUnique({
      where: {
        id: productId,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.stock < quantity)
      throw new BadRequestException('Product out of stock is not enough');

    let cart = await this.prismaService.cart.findUnique({ where: { userId } });
    if (!cart)
      cart = await this.prismaService.cart.create({ data: { userId } });
    return this.prismaService.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },

      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  async getCart(userId: string) {
    const cart = await this.prismaService.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart) return { items: [], totalPrice: 0 };

    const total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    return { ...cart, totalPrice: total };
  }

  async removeItem(userId: string, product: string) {
    const cart = await this.prismaService.cart.findUnique({
      where: { userId },
    });
    if (!cart) return;
    return this.prismaService.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product,
        },
      },
    });
  }
}
