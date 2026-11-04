import {
  Body,
  Controller,
  Get,
  ParseBoolPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { Organization } from 'src/decorators/organization.decorator';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UserRole } from 'src/config/enum';
import { GetBookmarksQueryDto } from './dto/get-bookmarks-query.dto';

@Controller('bookmarks')
@UseGuards(RoleGuard)
@Roles(UserRole.STUDENT, UserRole.ORGANIZATION)
export class BookmarksController {
  constructor(private readonly bookmarksservice: BookmarksService) {}

  @Post()
  async toggleBookmark(
    @Organization() organization: IOrganization,
    @Body() input: CreateBookmarkDto,
    @Query('orgId', new ParseUUIDPipe({ version: '4', optional: true }))
    orgId?: string,
  ) {
    return await this.bookmarksservice.toggleBookmark(
      organization,
      input,
      orgId,
    );
  }
 @Get("/count")
 async getBookmarkCount(
   @Organization() organization: IOrganization,
   @Query('orgId', new ParseUUIDPipe({ version: '4', optional: true }))
    orgId?: string,
  ){
   return await this.bookmarksservice.getBookmarkCount(organization,orgId);
  }
  @Get()
  async getAllBookmark(
    @Organization() organization: IOrganization,
    @Query() query: GetBookmarksQueryDto,
  ) {
    return await this.bookmarksservice.getAllBookmark(
      organization,
      query,
    );
  }
}
