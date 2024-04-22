import { Injectable } from '@nestjs/common';
import {
  Attachment,
  EmailParams,
  MailerSend,
  Recipient,
  Sender,
} from 'mailersend';
import { ResponseMsgService } from 'src/commons';
import { MailerSendRequest } from './dto/mailersend.request';
import * as fs from 'fs';
import { config } from 'src/commons/config';
import { MailersendAttachmentsDto } from './dto/mailersend.dto';
import { FilesService } from 'src/modules/files/files.service';

// export const TEMPLATE = {
//   SET_PASSWORD: 'pxkjn41z9k5lz781',
// };

@Injectable()
export class MailerSendService {
  private instance;
  constructor(
    private responseMsgService: ResponseMsgService,
    private filesService: FilesService,
  ) {
    this.instance = new MailerSend({
      apiKey: config.mailersend_api_key,
    });
  }

  /**
   * Sends an email using Mailersend service.
   *
   * @param {MailerSendRequest} data - The data object containing email details.
   * @param {MailersendAttachmentsDto[]} [embedded] - Optional. An array of embedded attachments.
   * @param {MailersendAttachmentsDto[]} [files] - Optional. An array of regular attachments.
   * @param {string} [template] - Optional. The email template to use.
   *
   * @returns {Promise<boolean | MailerSendResponse>} - Returns a promise that resolves to a boolean value or MailerSend response.
 */
  async sendMail(
    data: MailerSendRequest,
    embedded?: MailersendAttachmentsDto[],
    files?: MailersendAttachmentsDto[],
    template?: string,
  ) {
    const recipients = [new Recipient(data.sent_to)];
    const attachments = [];
    const sentFrom = new Sender(data.received_from, data.received_from_name);

    if (embedded && embedded.length > 0) {
      try {
        embedded.map((value: MailersendAttachmentsDto) => {
          const resPath = this.filesService.getFilePathByFileId(value.file_id);
          attachments.push({
            content: fs.readFileSync(resPath, {
              encoding: 'base64',
            }),
            disposition: 'inline',
            filename: value.fileName,
            id: 'image_' + value.file_id,
          });
        });
      } catch (e) {
        console.log('mailersend embedded', e);
      }
    }

    if (files && files.length > 0) {
      try {
        files.map((value: MailersendAttachmentsDto) => {
          const resPath = this.filesService.getFilePathByFileId(value.file_id);
          attachments.push(
            new Attachment(
              fs.readFileSync(resPath, {
                encoding: 'base64',
              }),
              value.fileName,
              'attachment',
            ),
          );
        });
      } catch (e) {
        console.log('mailersend files', e);
      }
    }

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(data.subject)
      .setAttachments(attachments);

    if (template) {
      const personalization = [
        {
          email: data.sent_to,
          data: data.personalization,
        },
      ];
      emailParams.setTemplateId(template).setPersonalization(personalization);
    } else {
      emailParams.setHtml(data.body);
    }

    const res = await this.instance.email.send(emailParams);
    if (res.statusCode === 202 || res.statusCode === 200) {
      if (res?.body && res?.body?.warnings) {
        res?.body?.warnings?.forEach((warning) => {
          this.responseMsgService.addErrorMsg({
            message: `${warning.message} Please contact to super admin.`,
            type: 'error',
            show: true,
          });
        });
        this.responseMsgService.isSuccess(false);
      } else {
        this.responseMsgService.addSuccessMsg({
          message: 'Mail was sent to provider',
          type: 'success',
          show: true,
        });
        this.responseMsgService.isSuccess(true);
      }
      return res;
    } else {
      this.responseMsgService.addErrorMsg({
        message: 'We are unable to connect mail provider',
        type: 'error',
        show: true,
      });
      this.responseMsgService.isSuccess(false);
      return false;
    }
  }
}
