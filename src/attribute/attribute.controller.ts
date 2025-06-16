import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Put,
  Delete,
  Param,
} from "@nestjs/common";
import { AttributeService } from "./attribute.service";
import { Attribute } from "./attribute.entity";
import { GetAttributesDto } from "./dtos/get-attributes.dto";
import { AttributeDto } from "./dtos/attribute.dto";

@Controller("attributes")
// I removed @UseInterceptors(CacheInterceptor) here as caching is now handled manually in the service
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  /**
   * GET /attributes
   * I'm returning a list of attributes based on optional filters, pagination, and sorting.
   * I'm handling caching manually within the AttributeService's getAttributes method.
   * @param queryDto DTO containing filter, pagination, and sorting parameters.
   * @returns A promise resolving to an array of attributes.
   */
  @Get()
  // I removed @CacheTTL here as caching is now handled manually in the service
  async getAttributes(
    @Query() queryDto: GetAttributesDto,
  ): Promise<Attribute[]> {
    return this.attributeService.getAttributes(queryDto);
  }

  /**
   * POST /attributes
   * I'm creating a new attribute. Invalidation logic is handled in the service.
   * @param body DTO for creating an attribute.
   * @returns The newly created attribute.
   */
  @Post()
  async createAttribute(@Body() body: AttributeDto): Promise<Attribute> {
    return this.attributeService.createAttribute(body.name, body.type);
  }

  /**
   * PUT /attributes/:id
   * I'm updating an existing attribute. Invalidation logic is handled in the service.
   * @param id The ID of the attribute to update.
   * @param body DTO for updating an attribute.
   * @returns The updated attribute.
   */
  @Put(":id")
  async updateAttribute(
    @Param("id") id: string,
    @Body() body: AttributeDto,
  ): Promise<Attribute> {
    return this.attributeService.updateAttribute(id, body.name, body.type);
  }

  /**
   * DELETE /attributes/:id
   * I'm deleting an attribute. Invalidation logic is handled in the service.
   * @param id The ID of the attribute to delete.
   */
  @Delete(":id")
  async deleteAttribute(@Param("id") id: string): Promise<void> {
    return this.attributeService.deleteAttribute(id);
  }
}
