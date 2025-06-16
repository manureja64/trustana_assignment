import { IsOptional, IsString, IsEnum, ValidateIf } from "class-validator";
import { PaginationDto } from "../../shared/dtos/pagination.dto";
import { Transform } from "class-transformer";

export enum AttributeLinkType {
  DIRECT = "direct",
  INHERITED = "inherited",
  GLOBAL = "global",
}

export class GetAttributesDto extends PaginationDto {
  @IsOptional()
  @IsString({ each: true }) // I'm ensuring each element in the array is a string
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : value.split(",").map((item: string) => item.trim()),
  )
  categoryId?: string | string[];

  @IsOptional()
  @IsEnum(AttributeLinkType, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : value.split(",").map((item: string) => item.trim()),
  )
  @ValidateIf((o) => o.categoryId !== undefined) // I'm making sure linkType is applicable only when categoryId is supplied
  linkType?: AttributeLinkType | AttributeLinkType[];

  @IsOptional()
  @IsString({ each: true }) // Each element in the array must be a string
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : value.split(",").map((item: string) => item.trim()),
  )
  @ValidateIf((o) => o.categoryId !== undefined) // I'm making sure excludeCategoryId is applicable only when categoryId is supplied
  excludeCategoryId?: string | string[];

  @IsOptional()
  @IsString()
  keyword?: string;
}
