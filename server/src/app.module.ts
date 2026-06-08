import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { InterviewController } from '@/interview.controller';
import { InterviewService } from '@/interview.service';

@Module({
  imports: [],
  controllers: [AppController, InterviewController],
  providers: [AppService, InterviewService],
})
export class AppModule {}
