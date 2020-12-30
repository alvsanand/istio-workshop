const path = require("path");

module.exports = {
    title: "Istio Workshop",
    description: "Istio Workshop",
    base: '/istio-workshop/',
    head: [
        ['link', { rel: "icon", href: "/favicon.ico" }]
    ],
    themeConfig: {
        displayAllHeaders: true,
        lastUpdated: false,
        docsDir: 'docs',
        editLinks: false,
        logo: '/istio_practice.png',
        nav: [
            { text: 'Home', link: '/' },
            {
                text: '@alvsanand',
                items: [
                    { text: 'Github', link: 'https://github.com/alvsanand' },
                    { text: 'LinekdIn', link: 'https://www.linkedin.com/in/alvsanand/' },
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
