import { Field, Int, ObjectType } from "@nestjs/graphql";
import { File } from "src/modules/file/entities/file.entity";

@ObjectType()
export class MailersendAttachmentsDto {
  @Field(() => Int, { nullable: true })
  file_id: number | null;

  @Field(() => Boolean, { nullable: true })
  embedded?: boolean | null;

  @Field(() => String, { nullable: true })
  fileName?: string | null;

  @Field(() => File, { nullable: true })
  files?: File;
}
