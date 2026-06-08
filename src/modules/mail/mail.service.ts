import {
  MAIL_QUEUE,
  SEND_ORDER_CONFIRM_JOB,
} from '@/common/constants/queue.constant';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
  constructor(@InjectQueue(MAIL_QUEUE) private mailQueue: Queue) {}

  async queueOrderConfirmationEmail(
    email: string,
    orderId: string,
    totalAmount: number,
  ) {
    await this.mailQueue.add(
      SEND_ORDER_CONFIRM_JOB,
      { email, orderId, totalAmount },
      {
        attempts: 3, // Number of times to retry the job
        backoff: 5000, // Time to wait before retrying the job
      },
    );
  }
}
