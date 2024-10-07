import { ObjectType } from "@nestjs/graphql";
import { IsEmail } from "class-validator";

@ObjectType()
export class MailerSendRequest {
  to: string;

  @IsEmail()
  received_from: string;

  body?: string;

  subject: string;

  received_from_name: string;

  personalization?: { [key: string]: any };
}
