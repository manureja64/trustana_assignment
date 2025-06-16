import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Attribute } from "./attribute.entity";
import { GetAttributesDto, AttributeLinkType } from "./dtos/get-attributes.dto";
import { CategoryService } from "../category/category.service";
import { CategoryAttributeService } from "../category-attribute/category-attribute.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class AttributeService {
  constructor(
    @InjectRepository(Attribute)
    private attributeRepository: Repository<Attribute>,
    private readonly categoryService: CategoryService,
    private readonly categoryAttributeService: CategoryAttributeService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // I'm injecting CacheManager
  ) {}

  /**
   * I'm retrieving a list of attributes based on various filters, including category,
   * link type, keyword, pagination, and sorting.
   * I'm caching the results of the query based on the DTO parameters.
   * @param queryDto DTO containing filter, pagination, and sorting parameters.
   * @returns A promise resolving to an array of attributes.
   */
  async getAttributes(queryDto: GetAttributesDto): Promise<Attribute[]> {
    // I'm generating a unique cache key based on all query parameters
    const cacheKey = `attributes_${JSON.stringify(queryDto)}`;
    const cachedAttributes = await this.cacheManager.get<Attribute[]>(cacheKey);

    if (cachedAttributes) {
      console.log(`I'm serving attributes from cache for query: ${cacheKey}`);
      return cachedAttributes;
    }

    console.log(`I'm fetching attributes from DB for query: ${cacheKey}`);
    const {
      categoryId,
      linkType,
      excludeCategoryId,
      keyword,
      page,
      limit,
      sortBy,
      sortOrder,
    } = queryDto;

    let attributeIds: string[] = [];
    let isFilteringByCategory = false;

    // 1. I'm determining the base set of attribute IDs based on category filters
    if (categoryId) {
      isFilteringByCategory = true;
      const categoryIdsArray = Array.isArray(categoryId)
        ? categoryId
        : [categoryId];
      let directAttributeIds: string[] = [];
      let inheritedAttributeIds: string[] = [];

      // I'm fetching direct and inherited attributes for all specified categories
      for (const catId of categoryIdsArray) {
        // Direct attributes
        const directLinks =
          await this.categoryAttributeService.findDirectLinksByCategoryId(
            catId,
          );
        directAttributeIds.push(...directLinks.map((link) => link.attributeId));

        // Inherited attributes (from ancestors' direct links)
        const ancestors = await this.categoryService.getAncestors(catId);
        for (const ancestor of ancestors) {
          const ancestorDirectLinks =
            await this.categoryAttributeService.findDirectLinksByCategoryId(
              ancestor.id,
            );
          inheritedAttributeIds.push(
            ...ancestorDirectLinks.map((link) => link.attributeId),
          );
        }
      }

      // I'm combining and deduplicating
      directAttributeIds = [...new Set(directAttributeIds)];
      inheritedAttributeIds = [...new Set(inheritedAttributeIds)];

      // I'm determining global attributes: those not linked to ANY category
      const allAttributes = await this.attributeRepository.find();
      const allDirectlyLinkedAttributeIds = (
        await this.categoryAttributeService.findAllCategoryAttributeLinks()
      ).map((ca) => ca.attributeId);
      const globalAttributeIds = allAttributes
        .filter((attr) => !allDirectlyLinkedAttributeIds.includes(attr.id))
        .map((attr) => attr.id);

      // I'm applying the linkType filter if provided
      const requestedLinkTypes = Array.isArray(linkType)
        ? linkType
        : linkType
          ? [linkType]
          : [];

      if (requestedLinkTypes.length === 0) {
        // If no linkType is specified, I'm returning all applicable (direct + inherited + global)
        attributeIds = [
          ...new Set([
            ...directAttributeIds,
            ...inheritedAttributeIds,
            ...globalAttributeIds,
          ]),
        ];
      } else {
        if (requestedLinkTypes.includes(AttributeLinkType.DIRECT)) {
          attributeIds.push(...directAttributeIds);
        }
        if (requestedLinkTypes.includes(AttributeLinkType.INHERITED)) {
          attributeIds.push(...inheritedAttributeIds);
        }
        if (requestedLinkTypes.includes(AttributeLinkType.GLOBAL)) {
          attributeIds.push(...globalAttributeIds);
        }
        attributeIds = [...new Set(attributeIds)];
      }
    } else {
      // If no categoryId, I'm returning ALL attributes
      const allAttributes = await this.attributeRepository.find();
      attributeIds = allAttributes.map((attr) => attr.id);
    }

    // I'm handling 'excludeCategoryId' (Bonus)
    if (excludeCategoryId) {
      if (!isFilteringByCategory) {
        // This filter is only applicable when categoryId parameter is supplied
        throw new NotFoundException(
          "excludeCategoryId filter requires categoryId parameter to be supplied.",
        );
      }
      const excludeCategoryIdsArray = Array.isArray(excludeCategoryId)
        ? excludeCategoryId
        : [excludeCategoryId];
      let attributesToExclude: string[] = [];

      for (const exCatId of excludeCategoryIdsArray) {
        // Attributes directly linked to excluded categories
        const directLinksToExclude =
          await this.categoryAttributeService.findDirectLinksByCategoryId(
            exCatId,
          );
        attributesToExclude.push(
          ...directLinksToExclude.map((link) => link.attributeId),
        );

        // Attributes inherited by excluded categories (from their ancestors' direct links)
        const ancestorsToExclude =
          await this.categoryService.getAncestors(exCatId);
        for (const ancestor of ancestorsToExclude) {
          const ancestorDirectLinks =
            await this.categoryAttributeService.findDirectLinksByCategoryId(
              ancestor.id,
            );
          attributesToExclude.push(
            ...ancestorDirectLinks.map((link) => link.attributeId),
          );
        }
      }

      // I'm considering global attributes as "applicable" if they are part of the set for the categories.
      // My logic here is to remove attributes that *are* applicable to the excluded categories.
      // So, if an attribute is global AND is part of the original applicable set derived from `categoryId`,
      // I need to remove it if `excludeCategoryId` asks for it.
      // For global attributes, I consider them applicable to *all* categories. So if a category is excluded,
      // and I'm filtering for non-applicable attributes, global attributes might be removed.
      const allDirectlyLinkedAttributeIds = (
        await this.categoryAttributeService.findAllCategoryAttributeLinks()
      ).map((ca) => ca.attributeId);
      const globalAttributeIds = (await this.attributeRepository.find())
        .filter((attr) => !allDirectlyLinkedAttributeIds.includes(attr.id))
        .map((attr) => attr.id);
      attributesToExclude.push(...globalAttributeIds);

      attributesToExclude = [...new Set(attributesToExclude)]; // I'm deduplicating

      // I'm removing attributes that are in the exclusion list from my current attributeIds list
      attributeIds = attributeIds.filter(
        (id) => !attributesToExclude.includes(id),
      );
    }

    // 2. I'm building the query for attributes based on collected IDs and other filters
    const queryBuilder =
      this.attributeRepository.createQueryBuilder("attribute");

    if (attributeIds.length > 0) {
      queryBuilder.andWhere("attribute.id IN (:...attributeIds)", {
        attributeIds,
      });
    } else if (
      isFilteringByCategory &&
      attributeIds.length === 0 &&
      !excludeCategoryId
    ) {
      return [];
    }

    // I'm applying the keyword filter
    if (keyword) {
      queryBuilder.andWhere("LOWER(attribute.name) LIKE LOWER(:keyword)", {
        keyword: `%${keyword}%`,
      });
    }

    // I'm applying sorting
    if (sortBy) {
      queryBuilder.orderBy(`attribute.${sortBy}`, sortOrder || "ASC");
    } else {
      // I'm setting a default sort for consistency
      queryBuilder.orderBy("attribute.createdAt", "DESC");
    }

    // I'm applying pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const result = await queryBuilder.getMany();

    // I'm caching the result for 1 minute
    await this.cacheManager.set(cacheKey, result, { ttl: 60 * 1000 });
    return result;
  }

  /**
   * This is a helper method I use to create a new attribute and invalidate caches.
   * @param name The name of the attribute.
   * @param type The type of the attribute.
   * @returns The created attribute.
   */
  async createAttribute(name: string, type: string): Promise<Attribute> {
    const attribute = this.attributeRepository.create({ name, type });
    const newAttribute = await this.attributeRepository.save(attribute);
    await this.invalidateAttributeCaches();
    return newAttribute;
  }

  /**
   * I'm updating an existing attribute and invalidating caches.
   * @param id The ID of the attribute to update.
   * @param name The new name for the attribute.
   * @param type The new type for the attribute.
   * @returns The updated attribute.
   */
  async updateAttribute(
    id: string,
    name?: string,
    type?: string,
  ): Promise<Attribute> {
    const attribute = await this.attributeRepository.findOne({ where: { id } });
    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${id} not found.`);
    }

    if (name) {
      attribute.name = name;
    }
    if (type) {
      attribute.type = type;
    }

    const updatedAttribute = await this.attributeRepository.save(attribute);
    await this.invalidateAttributeCaches();
    return updatedAttribute;
  }

  async deleteAttribute(id: string): Promise<void> {
    const result = await this.attributeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Attribute with ID ${id} not found.`);
    }
    await this.invalidateAttributeCaches(); // I'm invalidating caches after deletion
  }

  private async invalidateAttributeCaches(): Promise<void> {
    console.log("I'm invalidating attribute caches...");
    // A broad reset will clear all cached API responses for /attributes
    await this.cacheManager.reset(); // I'm clearing all entries, which is safe but not granular
  }
}
