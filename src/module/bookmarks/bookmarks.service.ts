import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookmarksRepository } from './bookmarks.repository';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { BookmarkType, UserRole } from 'src/config/enum';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class BookmarksService {
  constructor(
    private readonly bookmarksrepository: BookmarksRepository,
    private readonly organizationsservice: OrganizationsService,
  ) {}
  async toggleBookmark(
    organization: IOrganization,
    input: CreateBookmarkDto,
    orgId?: string,
  ) {
    try {
      let targetOrgId = orgId;
      if (organization.role === UserRole.ORGANIZATION) {
        targetOrgId = organization.org_id;
      }

      if (!targetOrgId) {
        throw new BadRequestException('Valid organization id is required');
      }

      const isValidOrganization =
        await this.organizationsservice.isValid(targetOrgId);

      if (!isValidOrganization) {
        throw new NotFoundException(
          'The requested organization could not be found or is inactive.',
        );
      }

      if (organization.role === UserRole.STUDENT) {
        const isValid = await this.organizationsservice.isValidUserOrganization(
          organization.user_id,
          targetOrgId,
        );
        if (!isValid) {
          throw new ForbiddenException(
            'Access denied: You are not authorized for this organization.',
          );
        }
      }

      const existingBookmark = await this.bookmarksrepository.findBookmark(
        organization.user_id,
        targetOrgId,
        input,
      );

      if (existingBookmark) {
        await this.bookmarksrepository.deleteBookmark(
          existingBookmark.bookmark_id,
        );
        return {
          message: 'Bookmark removed successfully.',
        };
      } else {
        const isValidBookmarkId = await this.isValidBookmarkId(
          input,
          targetOrgId,
        );

        if (!isValidBookmarkId) {
          throw new NotFoundException('The requested resource is unavailable.');
        }

        return await this.bookmarksrepository.saveBookmark(
          input,
          organization.user_id,
          targetOrgId,
        );
      }
    } catch (err) {
      throw err;
    }
  }
  async isValidBookmarkId(input: CreateBookmarkDto, orgId: string) {
    try {
      let isValid = false;

      if (input.item_type === BookmarkType.TEST) {
        isValid = await this.bookmarksrepository.isValidTest(
          input.item_id,
          orgId,
        );
      } else if (input.item_type === BookmarkType.TEST_SET) {
        isValid = await this.bookmarksrepository.isValidTestSet(
          input.item_id,
          orgId,
        );
      }

      return isValid;
    } catch (err) {
      throw err;
    }
  }
  async getAllBookmark(
    organization: IOrganization,
    isOrgBookmark?: boolean,
    orgId?: string,
  ) {
    try {
      if (organization.role === UserRole.ORGANIZATION) {
        return await this.bookmarksrepository.getAllOrgBookmark(
          organization.org_id,
        );
      }
      if (!orgId) {
        throw new BadRequestException('Valid organization id is required');
      }

      const isValidOrganization =
        await this.organizationsservice.isValid(orgId);

      if (!isValidOrganization) {
        throw new NotFoundException(
          'The requested organization could not be found or is inactive.',
        );
      }

      const isValid = await this.organizationsservice.isValidUserOrganization(
        organization.user_id,
        orgId,
      );
      if (!isValid) {
        throw new ForbiddenException(
          'Access denied: You are not authorized for this organization.',
        );
      }

      if (isOrgBookmark) {
        return await this.bookmarksrepository.getAllOrgBookmark(orgId);
      } else {
        return await this.bookmarksrepository.getAllBookmark(
          orgId,
          organization.user_id,
        );
      }
    } catch (err) {
      throw err;
    }
  }
}
