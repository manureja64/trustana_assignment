import { IsOptional, IsNumber, IsString, IsIn, Min } from "class-validator";
import { Type } from "class-transformer";

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number) // I'm ensuring transformation from query string to number
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number) // I'm ensuring transformation from query string to number
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string; // This is the field I'm sorting by

  @IsOptional()
  @IsString()
  @IsIn(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "ASC"; // This is the sort order
}
