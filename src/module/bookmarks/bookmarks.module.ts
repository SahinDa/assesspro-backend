import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Bookmark } from "./entities/bookmark.entity";
import { BookmarksRepository } from "./bookmarks.repository";
import { BookmarksController } from "./bookmarks.controller";
import { BookmarksService } from "./bookmarks.service";

@Module({
 imports:[TypeOrmModule.forFeature([Bookmark])],
 controllers:[BookmarksController],
 providers:[BookmarksService,BookmarksRepository],
 exports:[BookmarksService,BookmarksRepository]
})
export class BookmarksModule {}