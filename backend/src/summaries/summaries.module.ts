import { Module } from '@nestjs/common';
import { SummariesService } from './summaries.servise';

@Module({
  providers: [SummariesService],
  exports: [SummariesService],
})
export class SummariesModule {}
