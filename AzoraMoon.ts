import {
    Source,
    Manga,
    Chapter,
    ChapterDetails,
    LanguageCode,
    MangaStatus,
    createManga,
    createChapter,
    createChapterDetails,
    RequestManager,
    SourceInfo,
    createRequest
} from 'paperback-extensions-common'

export const AzoraMoonInfo: SourceInfo = {
    version: '0.9.2',
    name: 'AzoraMoon',
    description: 'جميع المانجات والفصول من azoramoon.com تلقائيًا',
    author: 'Remas & ChatGPT',
    websiteBaseURL: 'https://azoramoon.com',
    language: LanguageCode.ARABIC,
    contentRating: 'EVERYONE'
}

export class AzoraMoon extends Source {
    requestManager = new RequestManager({requestsPerSecond: 2})

    constructor() { super(AzoraMoonInfo) }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequest({ url: mangaId, method: 'GET' })
        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data)

        const title = $('h1.entry-title').text().trim()
        const image = $('.summary_image img').attr('data-src') || $('.summary_image img').attr('src') || ''
        const desc = $('.description-summary').text().trim()
        let status = MangaStatus.ONGOING
        const statusText = $('.post-status .summary-content').text().toLowerCase()
        if (statusText.includes('completed')) status = MangaStatus.COMPLETED
        else if (statusText.includes('hiatus')) status = MangaStatus.ON_HIATUS

        return createManga({
            id: mangaId,
            titles: [title],
            image: image,
            desc: desc,
            status: status,
            author: ''
        })
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequest({ url: mangaId, method: 'GET' })
        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data)

        const chapters: Chapter[] = []
        $('.listing-chapters_wrap .wp-manga-chapter a').each((i, el) => {
            const name = $(el).text().trim()
            const id = $(el).attr('href') || ''
            chapters.push(createChapter({
                id: id,
                mangaId: mangaId,
                name: name,
                langCode: LanguageCode.ARABIC
            }))
        })
        return chapters
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequest({ url: chapterId, method: 'GET' })
        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data)

        const pages: string[] = []
        $('.page-break img').each((i, el) => {
            const src = $(el).attr('data-src') || $(el).attr('src')
            if (src) pages.push(src)
        })

        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pages,
            longStrip: true
        })
    }
}