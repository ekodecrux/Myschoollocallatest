export const structureFilter = [
    {
        name: 'JPG',
        type: 'jpg'
    },
    {
        name: 'PDF',
        type: 'pdf'
    },
    {
        name: 'PNG',
        type: 'png'
    },
    {
        name: 'PSD',
        type: 'psd'
    },
    {
        name: 'EPS',
        type: 'eps'
    },
    {
        name: 'GIF',
        type: 'gif'
    },
    {
        name: 'DOC',
        type: 'doc'
    },
    {
        name: 'FLV',
        type: 'flv'
    },
    {
        name: 'SWF',
        type: 'swf'
    },
    {
        name: 'MP4',
        type: 'mp4'
    },
    {
        name: 'MP3',
        type: 'mp3'
    },
    {
        name: 'Image',
        type: 'image'
    },
    {
        name: 'Document',
        type: 'image'
    },
    {
        name: 'Animation',
        type: 'image'
    },
    {
        name: 'Video',
        type: 'image'
    },
    {
        name: 'Audio',
        type: 'image'
    }
]
export const fileType = {
    'JPC' : 'jpg',
    'JPB' : 'jpg',
    'BMC' : 'bmp',
    'BMW' : 'bmp',
    'WBC' : 'webp',
    'WBB' : 'webp',
    'AVC' : 'avif',
    'AVB' : 'avif',
    'SVC' : 'svg',
    'SVB' : 'svg',
    'TFC' : 'jpg',
    'TFB' : 'jpg',
    'DCC' : 'doc',
    'DCB' : 'doc',
    'PDC' : 'pdf',
    'PDB' : 'pdf',
    'PPC' : 'ppt',
    'PPB' : 'ppt',
    'GIF' : 'gif',
}
export const newFilter = [
    {
        name: 'IMAGES',
        children: [
            {
                name: 'JPG',
                type: 'jpg',
                endCode: ['JPC', 'JPB']
            },
            {
                name: 'JPEG',
                type: 'jpeg',
                endCode: ['JPC', 'JPB']
            },
            {
                name: 'BMP',
                type: 'bmp',
                endCode: ['BMC','BMW']
            },
            {
                name: 'WEBP',
                type: 'webp',
                endCode: ['WBC','WBB']
            },
            {
                name: 'AVIF',
                type: 'avif',
                endCode: ['AVC','AVB']
            },
            {
                name: 'SVG',
                type: 'svg',
                endCode: ['SVC','SVB']
            },
            {
                name: 'TIFF',
                type: 'tiff',
                endCode: ['TFC','TFB']
            }
        ]
    },
    {
        name: 'DOCUMENT',
        children: [
            {
                name: 'DOC',
                type: 'doc',
                endCode: ['DCC','DCB']
            },
            {
                name: 'DOCX',
                type: 'docx',
                endCode: ['DCC','DCB']
            },
            {
                name: 'PDF',
                type: 'pdf',
                endCode: ['PDC', 'PDB']
            },
            {
                name: 'PPT',
                type: 'ppt',
                endCode: ['PPC','PPB']
            }
        ]
    },
    {
        name: 'AUDIO',
        children: [
            {
                name: 'MP3',
                type: 'mp3',
                endCode: ['MP3']
            },
            {
                name: 'WAV',
                type: 'wav',
                endCode: ['WAV']
            },
            {
                name: 'OGG',
                type: 'ogg',
                endCode: ['OGG']
            },
            {
                name: 'PCM',
                type: 'pcm',
                endCode: ['PCM']
            },
            {
                name: 'FLAC',
                type: 'flac',
                endCode: ['FLV']
            }
        ]
    },
    {
        name: 'VIDEO',
        children: [
            {
                name: 'MP4',
                type: 'mp4',
                endCode: ['MP4']
            },
            {
                name: 'WEBM',
                type: 'webm',
                endCode: ['WEB']
            },
            {
                name: 'OGG',
                type: 'ogg',
                endCode: ['OGG']
            }
        ]
    },
    {
        name: 'ANIMATIONS',
        children: [
            {
                name: 'GIF',
                type: 'gif',
                endCode: ['GIF']
            },
            {
                name: 'APNG',
                type: 'apng',
                endCode: ['APNG']
            }
        ]
    }
] 