import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class MailersendBase64AttachmentsDto {
  @Field(() => String)
  base64: string;

  @Field(() => String)
  originalName: string;
}
