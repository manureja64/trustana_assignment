// src/attribute/dtos/attribute.dto.ts
// This DTO would be used for creating/updating attributes
import { IsString, IsBoolean, IsNotEmpty, IsOptional } from "class-validator";

export class AttributeDto {
  @IsOptional() // Make optional for PUT requests
  @IsNotEmpty()
  @IsString()
  name?: string;

  @IsOptional() // Make optional for PUT requests
  @IsNotEmpty()
  @IsString()
  type?: string; // e.g., 'Short Text', 'Dropdown'
}
