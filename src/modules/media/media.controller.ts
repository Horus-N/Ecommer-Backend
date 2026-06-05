import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { storage } from '@/common/configs/cloudinary.config';
import { FileInterceptor } from '@nestjs/platform-express';
@ApiTags('Media Management')
@Controller('media')
export class MediaController {
  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data') //used to declare what format the request being sent should use.
  //Used to describe the data sent in the request body
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('file', file);
    if (!file) {
      throw new BadRequestException('Please upload a file!');
    }
    return {
      iamgeUrl: file.path,
    };
  }
}
