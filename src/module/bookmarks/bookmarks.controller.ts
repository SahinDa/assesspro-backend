import { Controller, Post } from "@nestjs/common";
import { BookmarksService } from "./bookmarks.service";

@Controller('bookmarks')
export class BookmarksController {
    constructor(private readonly bookmarksservice : BookmarksService){}

    @Post()
    async toggleBookmarks(){
        
    }

}