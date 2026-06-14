import { Injectable } from "@nestjs/common";
import { BookmarksRepository } from "./bookmarks.repository";

@Injectable()
export class BookmarksService {
    constructor(private readonly bookmarksrepository : BookmarksRepository){}
}