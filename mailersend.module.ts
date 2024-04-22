import { Module } from '@nestjs/common';
import { ResponseMsgService } from 'src/commons';
import { MailerSendService } from './mailersend.service';
import { FilesModule } from 'src/modules/files/files.module';

@Module({
  imports: [FilesModule],
  providers: [MailerSendService, ResponseMsgService],
  exports: [MailerSendService],
})
export class MailerSendModule {}
