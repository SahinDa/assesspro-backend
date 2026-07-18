import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { BookmarksRepository } from './bookmarks.repository';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark]), OrganizationsModule],
  controllers: [BookmarksController],
  providers: [BookmarksService, BookmarksRepository],
  exports: [BookmarksService, BookmarksRepository],
})
export class BookmarksModule {}
