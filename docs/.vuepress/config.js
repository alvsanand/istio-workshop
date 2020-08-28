module.exports = {
    title: "Istio Workshop by Bluetab Cloud Practice",
    description: "Istio Workshop by Bluetab Cloud Practice",
    base: '/istio-workshop/',
    head: [
        ['link', { rel: "icon", href: "/favicon.ico" }]
    ],
    themeConfig: {
        displayAllHeaders: true,
        lastUpdated: true,
        repo: 'https://gitlab.bluetab.net/cloud-practice/art-culos-kubernetes/istio-workshop',
        docsDir: 'docs',
        editLinks: false,
        logo: '/istio_practice.png',
        nav: [
            { text: 'Home', link: '/' },
            {
                text: 'Istio links',
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
        ['@vuepress/medium-zoom'],
        ['@vuepress/back-to-top'],
        ['seo']
    ]
}
