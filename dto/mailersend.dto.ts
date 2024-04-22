import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MailersendAttachmentsDto {
  @Field(() => Int, { nullable: true })
  file_id: number | null;

  @Field(() => Boolean, { nullable: true })
  embedded?: boolean | null;

  @Field(() => String, { nullable: true })
  fileName?: string | null;
}
