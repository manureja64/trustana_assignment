import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
  Column,
} from "typeorm";
import { Category } from "../category/category.entity";
import { Attribute } from "../attribute/attribute.entity";

@Entity("category_attributes") // This is the table name for the junction
@Unique(["categoryId", "attributeId"]) // I'm ensuring a unique combination of category and attribute, which also creates a unique index
export class CategoryAttribute {
  @PrimaryGeneratedColumn("uuid") // I'm using UUIDs for primary keys
  id: string;

  @Column()
  @Index() // I'm adding an index on categoryId for faster lookups of attributes by category
  categoryId: string; // I'm storing the ID directly for the unique constraint

  @Column()
  @Index() // I'm adding an index on attributeId for faster lookups of categories by attribute
  attributeId: string; // I'm storing the ID directly for the unique constraint

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.categoryAttributes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "categoryId" }) // I'm defining the foreign key column name
  category: Category;

  @ManyToOne(() => Attribute, (attribute) => attribute.categoryAttributes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "attributeId" }) // I'm defining the foreign key column name
  attribute: Attribute;
}
