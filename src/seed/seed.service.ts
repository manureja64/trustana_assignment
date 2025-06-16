// src/seed/seed.service.ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { CategoryService } from "../category/category.service";
import { AttributeService } from "../attribute/attribute.service";
import { CategoryAttributeService } from "../category-attribute/category-attribute.service";
import { Category } from "../category/category.entity";
import { Attribute } from "../attribute/attribute.entity";
import { DataSource } from "typeorm"; // Import DataSource

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly attributeService: AttributeService,
    private readonly categoryAttributeService: CategoryAttributeService,
    private readonly dataSource: DataSource, // Inject DataSource
  ) {}

  async onModuleInit() {
    // await this.seedData(); // Uncomment to run seeding on app start
  }

  async seedData() {
    console.log("Seeding database...");

    // Clear existing data (use with caution!)
    // Truncate tables in the correct order to avoid foreign key constraints
    await this.dataSource.query(
      'TRUNCATE TABLE "category_attributes" RESTART IDENTITY CASCADE;',
    );
    await this.dataSource.query(
      'TRUNCATE TABLE "categories" RESTART IDENTITY CASCADE;',
    );
    await this.dataSource.query(
      'TRUNCATE TABLE "attributes" RESTART IDENTITY CASCADE;',
    );
    console.log("Existing data truncated.");

    // Create Categories
    const foodGrocery =
      await this.categoryService.createCategory("Food & Grocery");
    const beverages = await this.categoryService.createCategory(
      "Beverages",
      foodGrocery.id,
    );
    const flavouredDrinks = await this.categoryService.createCategory(
      "Flavoured Drinks",
      beverages.id,
    );
    const carbonatedDrinks = await this.categoryService.createCategory(
      "Carbonated Drinks",
      beverages.id,
    );
    const snacks = await this.categoryService.createCategory(
      "Snacks",
      foodGrocery.id,
    );
    const electronics =
      await this.categoryService.createCategory("Electronics");
    const phones = await this.categoryService.createCategory(
      "Phones",
      electronics.id,
    );
    const smartphones = await this.categoryService.createCategory(
      "Smartphones",
      phones.id,
    );

    console.log("Categories created.");

    // Create Attributes
    const colorAttr = await this.attributeService.createAttribute(
      "Color",
      "Short Text",
    );
    const flavourAttr = await this.attributeService.createAttribute(
      "Flavour",
      "Dropdown",
    );
    const brandAttr = await this.attributeService.createAttribute(
      "Brand",
      "Short Text",
    );
    const materialAttr = await this.attributeService.createAttribute(
      "Material",
      "Short Text",
    ); // Will be global by default
    const usageInstructionsAttr = await this.attributeService.createAttribute(
      "Usage Instructions",
      "Long Text",
    );
    const storageAttr = await this.attributeService.createAttribute(
      "Storage Capacity",
      "Short Text",
    ); // Will be global by default

    console.log("Attributes created.");

    // Create Direct Links (CategoryAttribute)
    await this.categoryAttributeService.createDirectLink(
      flavouredDrinks.id,
      colorAttr.id,
    );
    await this.categoryAttributeService.createDirectLink(
      flavouredDrinks.id,
      flavourAttr.id,
    );
    await this.categoryAttributeService.createDirectLink(
      beverages.id,
      brandAttr.id,
    ); // Direct link to Beverages
    await this.categoryAttributeService.createDirectLink(
      snacks.id,
      usageInstructionsAttr.id,
    );
    await this.categoryAttributeService.createDirectLink(
      smartphones.id,
      storageAttr.id,
    );
    await this.categoryAttributeService.createDirectLink(
      smartphones.id,
      brandAttr.id,
    );

    console.log("Direct attribute links created.");

    console.log("Seeding complete!");
    console.log("----------------------------------------------------");
    console.log("Sample Data IDs:");
    console.log(`Food & Grocery Category ID: ${foodGrocery.id}`);
    console.log(`Beverages Category ID: ${beverages.id}`);
    console.log(`Flavoured Drinks Category ID: ${flavouredDrinks.id}`);
    console.log(`Carbonated Drinks Category ID: ${carbonatedDrinks.id}`);
    console.log(`Snacks Category ID: ${snacks.id}`);
    console.log(`Electronics Category ID: ${electronics.id}`);
    console.log(`Phones Category ID: ${phones.id}`);
    console.log(`Smartphones Category ID: ${smartphones.id}`);
    console.log("---");
    console.log(`Color Attribute ID: ${colorAttr.id}`);
    console.log(`Flavour Attribute ID: ${flavourAttr.id}`);
    console.log(`Brand Attribute ID: ${brandAttr.id}`);
    console.log(
      `Material Attribute ID: ${materialAttr.id} (This is a GLOBAL attribute)`,
    );
    console.log(`Usage Instructions Attribute ID: ${usageInstructionsAttr.id}`);
    console.log(`Storage Capacity Attribute ID: ${storageAttr.id}`);
    console.log("----------------------------------------------------");
  }
}
