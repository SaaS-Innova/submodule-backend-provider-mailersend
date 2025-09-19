import { BadRequestException, Injectable } from "@nestjs/common";
import {
  Attachment,
  EmailParams,
  MailerSend,
  Recipient,
  Sender,
} from "mailersend";
import { ResponseMsgService } from "src/commons";
import { MailerSendRequest, MailHeader } from "./dto/mailersend.request";
import { config } from "src/commons/config";
import { MailersendAttachmentsDto } from "./dto/mailersend.dto";
import { FileProvider } from "../file-provider/file-provider.service";
import {
  MAX_BASE64_SIZE,
  MAX_BODY_SIZE_BYTES,
  MAX_BODY_SIZE_MB,
} from "./const";

@Injectable()
export class MailerSendService {
  private readonly instance;
  constructor(
    private readonly responseMsgService: ResponseMsgService,
    private readonly fileProvider: FileProvider
  ) {
    this.instance = new MailerSend({
      apiKey: config.MAILERSEND_API_KEY,
    });
  }

  /**
   * Sends an email using Mailersend service.
   *
   * @param {MailerSendRequest} data - The data object containing email details.
   * @param {MailersendAttachmentsDto[]} [embedded] - Optional. An array of embedded attachments.
   * @param {MailersendAttachmentsDto[]} [files] - Optional. An array of regular attachments.
   * @param {string} [template] - Optional. The email template to use.
   * @param {MailHeader[]} [headers] - Optional. Custom headers for the email.
   *
   * @returns {Promise<boolean | MailerSendResponse>} - Returns a promise that resolves to a boolean value or MailerSend response.
   */
  async sendMail(
    data: MailerSendRequest,
    embedded?: MailersendAttachmentsDto[],
    files?: MailersendAttachmentsDto[],
    template?: string,
    headers?: MailHeader[]
  ) {
    this.validateHTMLSize(data.body);
    const recipients = JSON.parse(data.to || "[]").map(
      (to: { email: string }) => new Recipient(to.email)
    );
    const recipientsCC = JSON.parse(data.cc || "[]").map(
      (cc: { email: string }) => new Recipient(cc.email)
    );
    const recipientsBCC = JSON.parse(data.bcc || "[]").map(
      (bcc: { email: string }) => new Recipient(bcc.email)
    );
    const attachments: Attachment[] = [];
    const sentFrom = new Sender(data.received_from, data.received_from_name);

    if (embedded && embedded.length > 0) {
      try {
        for (const value of embedded) {
          const res = await this.fileProvider.getFileDetails(value.files);
          this.validateBase64Size(
            res.base64,
            res.originalName,
            MAX_BASE64_SIZE
          );
          attachments.push(
            new Attachment(
              res.base64,
              res.originalName,
              "inline",
              "image_" + value.file_id
            )
          );
        }
      } catch (e) {
        console.log("mailersend embedded", e);
      }
    }

    if (files && files.length > 0) {
      try {
        for (const value of files) {
          const res = await this.fileProvider.getFileDetails(value.files);
          this.validateBase64Size(
            res.base64,
            res.originalName,
            MAX_BASE64_SIZE
          );
          attachments.push(
            new Attachment(res?.base64, res.originalName, "attachment")
          );
        }
      } catch (e) {
        console.log("mailersend files", e);
      }
    }

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setCc(recipientsCC)
      .setBcc(recipientsBCC)
      .setSubject(data.subject)
      .setAttachments(attachments);

    (emailParams as any).headers = headers;

    if (data.inReplyTo) {
      emailParams.setInReplyTo(data.inReplyTo);
    }

    if (data.replyReferences && data.replyReferences.length > 0) {
      (emailParams as any).references = data.replyReferences;
    }

    if (template) {
      const personalization = JSON.parse(data.to || "[]").map(
        (to: { email: string }) => ({
          email: to.email,
          data: data.personalization,
        })
      );
      emailParams.setTemplateId(template).setPersonalization(personalization);
    } else {
      emailParams.setHtml(data.body);
    }

    try {
      const res = await this.instance.email.send(emailParams);
      if (res.statusCode === 202 || res.statusCode === 200) {
        if (res?.body && res?.body?.warnings) {
          res?.body?.warnings?.forEach((warning) => {
            this.responseMsgService.addErrorMsg({
              message: `${warning.message} Please contact to super admin.`,
              type: "error",
              show: true,
            });
          });
          this.responseMsgService.isSuccess(false);
        } else {
          this.responseMsgService.addSuccessMsg({
            message: "Mail was sent to provider",
            type: "success",
            show: true,
          });
          this.responseMsgService.isSuccess(true);
        }
        return res;
      }
    } catch (error) {
      console.log("mailersend error", error);
      this.responseMsgService.addErrorMsg({
        message: "We are unable to connect mail provider",
        type: "error",
        show: true,
      });
      this.responseMsgService.isSuccess(false);
      return false;
    }
  }

  validateHTMLSize(body: any): void {
    const bodyString = typeof body === "string" ? body : JSON.stringify(body);
    const bodySize = new TextEncoder().encode(bodyString).length;

    if (bodySize > MAX_BODY_SIZE_BYTES) {
      const errorMessage = `Body size exceeds the maximum limit of ${MAX_BODY_SIZE_MB} MB.`;
      this.responseMsgService.addSuccessMsg({
        message: errorMessage,
        type: "error",
        show: true,
      });
      throw new BadRequestException(errorMessage);
    }
  }

  private validateBase64Size(
    base64: string,
    fileName: string,
    maxSize: number
  ): void {
    if (!base64 || base64 === "undefined") {
      const errorMessage = `File ${fileName} is missing or invalid base64 data.`;
      this.responseMsgService.addSuccessMsg({
        message: errorMessage,
        type: "error",
        show: true,
      });
      throw new BadRequestException(errorMessage);
    }
    let paddingLength = 0;
    if (base64.endsWith("==")) {
      paddingLength = 2;
    } else if (base64.endsWith("=")) {
      paddingLength = 1;
    }

    const base64Size = (base64.length * 3) / 4 - paddingLength;
    if (base64Size > maxSize) {
      const errorMessage = `File ${fileName} exceeds the size limit of ${
        maxSize / (1024 * 1024)
      }MB.`;
      this.responseMsgService.addSuccessMsg({
        message: errorMessage,
        type: "error",
        show: true,
      });
      throw new BadRequestException(errorMessage);
    }
  }
}
