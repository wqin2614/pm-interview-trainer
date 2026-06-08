import {
  BadRequestException,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InterviewService } from '@/interview.service';

type UploadedAudioFile = {
  buffer: Buffer;
  originalname?: string;
};

@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('transcribe')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 25 * 1024 * 1024,
      },
    }),
  )
  async transcribe(@UploadedFile() file?: UploadedAudioFile): Promise<{ status: string; data: { text: string } }> {
    if (!file?.buffer) {
      throw new BadRequestException('Audio file is required');
    }

    const result = await this.interviewService.transcribeAudio(file.buffer, file.originalname);

    return {
      status: 'success',
      data: result,
    };
  }
}
