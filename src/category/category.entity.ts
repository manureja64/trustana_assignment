import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from "typeorm";
import { CategoryAttribute } from "../category-attribute/category-attribute.entity";

@Entity("categories") // This is the table name in PostgreSQL
export class Category {
  @PrimaryGeneratedColumn("uuid") // I'm using UUIDs for primary keys
  id: string;

  @Column({ unique: true }) // I'm making sure category names are unique
  @Index() // I'm adding an index on name for faster lookups
  name: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  // Self-referencing relationship for hierarchical categories
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "parentId" }) // I'm defining the foreign key column name
  @Index() // I'm adding an index on parentId for faster tree traversals
  parent: Category;

  @Column({ nullable: true })
  parentId: string; // This is an explicit column for parentId for indexing

  // This is a one-to-many relationship for children (standard self-referencing)
  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  // This is a many-to-many relationship with Attribute via CategoryAttribute junction table
  // I'm keeping this relationship as it's still valid and important for attributes
  @OneToMany(
    () => CategoryAttribute,
    (categoryAttribute) => categoryAttribute.category,
  )
  categoryAttributes: CategoryAttribute[];
}
