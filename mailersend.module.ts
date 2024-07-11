import { Module } from "@nestjs/common";
import { ResponseMsgService } from "src/commons";
import { MailerSendService } from "./mailersend.service";
import { FileModule } from "src/modules/file/file.module";
import { FileProviderModule } from "../file-provider/file-provider.module";

@Module({
  imports: [FileModule, FileProviderModule],
  providers: [MailerSendService, ResponseMsgService],
  exports: [MailerSendService],
})
export class MailerSendModule {}
