import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity("bookmarks")
@Index(["user_id"]) 
export class Bookmark {

  @PrimaryGeneratedColumn("uuid")
  bookmark_id: string;

  @Column("uuid")
  user_id: string;

  @Column("uuid")
  set_id: string;  
}