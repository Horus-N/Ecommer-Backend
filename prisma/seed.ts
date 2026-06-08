import { PrismaClient, Role } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      new ConfigService().get('DATABASE_URL') || process.env.DATABASE_URL,
  }),
});

async function main() {
  console.log('🔄 Đang khởi tạo dữ liệu mẫu cho hệ thống...');

  // 1. Dọn dẹp dữ liệu cũ để tránh trùng lặp khi chạy lại lệnh seed (Xóa theo thứ tự N-1)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Đã xóa sạch dữ liệu cũ trong Database.');

  // 2. Tạo Tài khoản mẫu (Mã hóa mật khẩu chuẩn chỉnh)
  const saltRound = 10;
  const adminPassword = await bcrypt.hash('admin123', saltRound);
  const customerPassword = await bcrypt.hash('customer123', saltRound);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ecommerce.com',
      password: adminPassword,
      name: 'Tech Lead Tùng Admin',
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@ecommerce.com',
      password: customerPassword,
      name: 'Nguyễn Văn Khách',
      role: Role.CUSTOMER,
    },
  });

  console.log('👤 Đã tạo tài khoản kiểm thử:');
  console.log('   - Admin: admin@ecommerce.com / admin123');
  console.log('   - Customer: customer@ecommerce.com / customer123');

  // 3. Tạo Danh mục sản phẩm (Categories)
  const catPhone = await prisma.category.create({
    data: {
      name: 'Điện thoại',
      description: 'Các dòng smartphone cao cấp và phổ thông',
    },
  });

  const catLaptop = await prisma.category.create({
    data: {
      name: 'Laptop',
      description: 'Máy tính xách tay làm việc, đồ họa và gaming',
    },
  });

  const catAccessory = await prisma.category.create({
    data: {
      name: 'Phụ kiện',
      description: 'Tai nghe, cáp sạc, chuột và bàn phím',
    },
  });

  console.log('📦 Đã tạo 03 danh mục sản phẩm gốc.');

  // 4. Tạo Sản phẩm mẫu (Products) kèm link ảnh và số lượng tồn kho định sẵn
  const productsData = [
    // Nhóm Điện thoại
    {
      name: 'iPhone 15 Pro Max 256GB',
      price: 29990000,
      stock: 15,
      categoryId: catPhone.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      price: 26990000,
      stock: 20,
      categoryId: catPhone.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
    {
      name: 'Xiaomi 14 Ultra',
      price: 19990000,
      stock: 10,
      categoryId: catPhone.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
    {
      name: 'Google Pixel 8 Pro',
      price: 17500000,
      stock: 5,
      categoryId: catPhone.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
    {
      name: 'Ondo Reno 11 Pro',
      price: 11990000,
      stock: 30,
      categoryId: catPhone.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },

    // Nhóm Laptop
    {
      name: 'MacBook Air M3 13-inch',
      price: 27490000,
      stock: 12,
      categoryId: catLaptop.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
    {
      name: 'ASUS ROG Strix G16 Gaming',
      price: 34990000,
      stock: 8,
      categoryId: catLaptop.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
    {
      name: 'Dell XPS 13 Plus',
      price: 42500000,
      stock: 4,
      categoryId: catLaptop.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
    {
      name: 'Lenovo ThinkPad X1 Carbon Gen 11',
      price: 39900000,
      stock: 6,
      categoryId: catLaptop.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
    {
      name: 'Acer Aspire 5 Slim',
      price: 12490000,
      stock: 50,
      categoryId: catLaptop.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },

    // Nhóm Phụ kiện
    {
      name: 'Tai nghe Apple AirPods Pro Gen 2',
      price: 5690000,
      stock: 40,
      categoryId: catAccessory.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
    {
      name: 'Chuột Logitech MX Master 3S',
      price: 2490000,
      stock: 25,
      categoryId: catAccessory.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
    {
      name: 'Bàn phím cơ Keychron K2 V2',
      price: 1850000,
      stock: 15,
      categoryId: catAccessory.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
    {
      name: 'Sạc nhanh Anker GaNPrime 65W',
      price: 950000,
      stock: 100,
      categoryId: catAccessory.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
    {
      name: 'Cáp sạc Baseus USB-C to C 100W',
      price: 150000,
      stock: 200,
      categoryId: catAccessory.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ],
    },
  ];

  for (const prod of productsData) {
    await prisma.product.create({ data: prod });
  }

  console.log(
    `🛍️ Đã nạp thành công ${productsData.length} sản phẩm mẫu vào Database.`,
  );
  console.log(
    '✨ Chúc mừng Tech Lead Tùng! Tiến trình Auto Seed hoàn tất 100%.',
  );
}

main()
  .catch((e) => {
    console.error('❌ Có lỗi xảy ra trong quá trình seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
