import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookmarksRepository } from './bookmarks.repository';
import { IOrganization } from 'src/interfaces/organization.interfaces';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { BookmarkType, UserRole , BookmarkTarget } from 'src/config/enum';
import { OrganizationsService } from '../organizations/organizations.service';
import { GetBookmarksQueryDto } from './dto/get-bookmarks-query.dto';

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
      let userId : string | null = organization.user_id;
      
      if (organization.role === UserRole.ORGANIZATION) {
        targetOrgId = organization.org_id;
        if (input.target_type === BookmarkTarget.STUDENT) {
          userId = null;
        }
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
        if (!userId) {
         throw new BadRequestException('Valid user id is required');
        }
        const isValid = await this.organizationsservice.isValidUserOrganization(
          userId,
          targetOrgId,
        );
        
        if (!isValid) {
          throw new ForbiddenException(
            'Access denied: You are not authorized for this organization.',
          );
        }
      }

      const existingBookmark = await this.bookmarksrepository.findBookmark(
        userId,
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
      } 
        const isValidBookmarkId = await this.isValidBookmarkId(
          input,
          targetOrgId,
        );

        if (!isValidBookmarkId) {
          throw new NotFoundException('The requested resource is unavailable.');
        }
        
        
        return await this.bookmarksrepository.saveBookmark(
          input,
          userId,
          targetOrgId,
        );
      
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
async getBookmarkCount(
  organization: IOrganization,
  orgId?: string,
) {
  const userId = organization.user_id;
  if (!userId) {
    throw new BadRequestException('Valid user id is required');
  }

  let resolvedOrgId: string | null = orgId ?? null;
  if (organization.role === UserRole.ORGANIZATION) {
    resolvedOrgId = organization.org_id;
  }

  if (!resolvedOrgId) {
    throw new BadRequestException('Valid organization id is required');
  }

  const isValidOrganization =
    await this.organizationsservice.isValid(resolvedOrgId);

  if (!isValidOrganization) {
    throw new NotFoundException(
      'The requested organization could not be found or is inactive.',
    );
  }

  if (organization.role === UserRole.STUDENT) {
    const isMember = await this.organizationsservice.isValidUserOrganization(
      userId,
      resolvedOrgId,
    );

    if (!isMember) {
      throw new ForbiddenException(
        'Access denied: You are not authorized for this organization.',
      );
    }
  }

  return await this.bookmarksrepository.getBookmarkCount(
    resolvedOrgId,
    userId,
    organization.role === UserRole.STUDENT,
  );
}
    
  async getAllBookmark(
    organization: IOrganization,
    input : GetBookmarksQueryDto
  ) {
    try {
      if (organization.role === UserRole.ORGANIZATION) {
        return await this.bookmarksrepository.getAllOrgBookmark(
          organization.org_id,
          organization.user_id,
          input.limit,
          input.offset,
          input.itemType,
        );
      }
      if (!input.orgId) {
        throw new BadRequestException('Valid organization id is required');
      }

      const isValidOrganization =
        await this.organizationsservice.isValid(input.orgId);

      if (!isValidOrganization) {
        throw new NotFoundException(
          'The requested organization could not be found or is inactive.',
        );
      }

      const isValid = await this.organizationsservice.isValidUserOrganization(
        organization.user_id,
        input.orgId,
      );
      if (!isValid) {
        throw new ForbiddenException(
          'Access denied: You are not authorized for this organization.',
        );
      }

      if (input.isOrgBookmark) {
        return await this.bookmarksrepository.getAllOrgBookmark(
          input.orgId,
          null,
          input.limit,
          input.offset,
          input.itemType,
        );
      } 
      
        return await this.bookmarksrepository.getAllBookmark(
          input.orgId,
          organization.user_id,
          input.limit,
          input.offset,
          input.itemType,
        );
    } catch (err) {
      throw err;
    }
  }
}
