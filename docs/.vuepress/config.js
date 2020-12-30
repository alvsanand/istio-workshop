const path = require("path");

const urlPath = '/istio-workshop';
const domain = 'https://alvsanand.github.io' + urlPath;
const title = 'Istio Workshop';
const description = title;
const author = 'alvsanand';

module.exports = {
    title: title,
    description: title,
    base: urlPath + '/',
    head: [
        ['link', { rel: "icon", href: "/favicon.ico" }]
    ],
    themeConfig: {
        displayAllHeaders: true,
        lastUpdated: false,
        docsDir: 'docs',
        editLinks: false,
        domain: domain,
        logo: '/istio_practice.png',
        nav: [
            { text: 'Home', link: '/' },
            {
                text: '@' + author,
                items: [
                    { text: 'Github', link: 'https://github.com/' + author },
                    { text: 'LinekdIn', link: 'https://www.linkedin.com/in/' + author },
                ]
            },
            { text: 'Bluetab', link: 'https://bluetab.net/' },
            {
                text: 'Links',
                items: [
                    { text: 'Istio', link: 'https://istio.io/' },
                    { text: 'Istio docs', link: 'https://istio.io/docs/' },
                ]
            }
        ],
        sidebar: [
            '/',
            '/technical_overview/',
            '/laboratory-01/',
            '/laboratory-02/',
            '/laboratory-03/',
            '/laboratory-04/',
        ]
    },
    plugins: [
        '@vuepress/medium-zoom',
        '@vuepress/back-to-top',
        'seo',
        'element-tabs'
    ],
    chainWebpack: config => {
        config.module
            .rule('md')
            .test(/\.md$/)
            .use(path.resolve(__dirname, './nunjucks'))
            .loader(path.resolve(__dirname, './nunjucks'))
            .end()
    },
}
