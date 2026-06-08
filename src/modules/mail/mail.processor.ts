import {
  MAIL_QUEUE,
  SEND_ORDER_CONFIRM_JOB,
} from '@/common/constants/queue.constant';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import * as nodeMailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private transporter;
  constructor(private configService: ConfigService) {
    super();
    this.transporter = nodeMailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.mailtrap.io',
      port: parseInt(this.configService.get('SMTP_PORT') || '587', 10),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case SEND_ORDER_CONFIRM_JOB: {
        const { email, orderId, totalAmount } = job.data;
        await this.transporter.sendMail({
          from: `E-Commerce Support ${this.configService.get('SMTP_USER')}`,
          to: email,
          subject: `🛒 Xác nhận đơn hàng #${orderId} thành công!`,
          html: `<h3>Cảm ơn bạn đã mua hàng!</h3>
                 <p>Mã đơn hàng của bạn là: <b>${orderId}</b></p>
                 <p>Tổng số tiền thanh toán: <b>${totalAmount.toLocaleString()} VND</b></p>
                 <p>Đơn hàng đang được hệ thống xử lý.</p>`,
        });

        console.log('====================================');
        console.log(
          `✉️ [BullMQ] Đã gửi mail xác nhận đơn hàng ${orderId} tới ${email}`,
        );
        console.log('====================================');
        break;
      }
    }
  }
}
