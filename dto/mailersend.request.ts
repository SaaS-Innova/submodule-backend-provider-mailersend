import { ObjectType } from "@nestjs/graphql";
import { IsEmail } from "class-validator";

@ObjectType()
export class MailerSendRequest {
  to: string;

  cc?: string;

  bcc?: string;

  @IsEmail()
  received_from: string;

  body?: string;

  subject: string;

  received_from_name: string;

  personalization?: { [key: string]: any };

  inReplyTo?: string;

  reply_references?: string[];
}

@ObjectType()
export class MailHeader {
  name: string;
  value: string;
}
