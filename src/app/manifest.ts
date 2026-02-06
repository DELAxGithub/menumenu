import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'menumenu',
        short_name: 'menumenu',
        description: 'Don\'t just read the menu. See the flavor.',
        start_url: '/',
        display: 'standalone',
        background_color: '#050505',
        theme_color: '#FF4B2B',
        orientation: 'portrait',
        icons: [
            {
                src: '/icon.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    }
}
