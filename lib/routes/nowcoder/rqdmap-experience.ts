import { Route } from '@/types';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';
import timezone from '@/utils/timezone';

const host = 'https://www.nowcoder.com';
const api_host = 'https://gw-c.nowcoder.com';

export const route: Route = {
    path: '/rqdmap-experience/:page',
    categories: ['bbs'],
    example: '/nowcoder/experience/639?order=3&companyId=665&phaseId=0',
    parameters: { tagId: '职位id [🔗查询链接](https://www.nowcoder.com/profile/all-jobs)复制打开' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['nowcoder.com/'],
            target: '/experience',
        },
    ],
    name: '面经',
    maintainers: ['huyyi'],
    handler,
    url: 'nowcoder.com/',
    description: `可选参数：

  -   companyId：公司 id，[🔗查询链接](https://www.nowcoder.com/discuss/tag/exp), 复制打开
  -   order：3 - 最新；1 - 最热
  -   phaseId：0 - 所有；1 - 校招；2 - 实习；3 - 社招`,
};

function escapeXML(str: string) {
    return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

async function handler(ctx) {
    const link = new URL('/api/sparta/job-experience/experience/job/list', api_host);
    const requestBody = {
        companyList: [],
        jobId: -1,
        level: 1,
        order: 3,
        page: ctx.req.param('page'),
        isNewJob: true,
    };

    // 发送 POST 请求
    const response = await got.post(link.toString(), {
        json: requestBody, // 发送的请求体为 JSON
        responseType: 'json', // 指定响应的格式为 JSON
    });

    // 处理返回的数据
    const data = response.data.data;

    const list = data.records.map((x) => {
        if (x.contentData) {
            const info = {
                title: x.contentData.title,
                link: new URL('discuss/' + x.contentId, host).href,
                author: x.userBrief.nickname + '(' + x.userBrief.educationInfo + ')',
                pubDate: timezone(parseDate(x.contentData.createTime), +8),
                category: x.contentData.typeName,

                description: '',
            };
            return info;
        } else if (x.momentData) {
            const info = {
                title: x.momentData.title,
                link: new URL('feed/main/detail/' + x.momentData.uuid, host).href,
                author: x.userBrief.nickname + '(' + x.userBrief.educationInfo + ')',
                pubDate: timezone(parseDate(x.momentData.createAt), +8),
                category: 'momentData',

                description: escapeXML(x.momentData.content),
            };
            return info;
        }
        return null;
    });

    return {
        title: `牛客面经-${ctx.req.param('page')}`,
        link: link.href,
        item: list,
    };
}
