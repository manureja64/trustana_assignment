import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { CategoryAttribute } from "../category-attribute/category-attribute.entity";

@Entity("attributes") // This is the table name for attributes
export class Attribute {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  @Index() // I'm adding an index on name for faster lookups
  name: string;

  @Column()
  type: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @OneToMany(
    () => CategoryAttribute,
    (categoryAttribute) => categoryAttribute.attribute,
  )
  categoryAttributes: CategoryAttribute[];
}
