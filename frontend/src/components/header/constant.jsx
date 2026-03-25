import arrow from "../../assests/homeScreen/arrow.svg";
import downArrow from "../../assests/homeScreen/downarrow.svg";
import gallery from "../../assests/homeScreen/gallery.svg";
import share from "../../assests/homeScreen/share.svg";
import star from "../../assests/homeScreen/star.svg";
import maker from "../../assests/homeScreen/makerLogo.svg";
export const navAPIDummy = {
    "grade": [
        {
            name: "1st Grade",
            lessons: 209,
            subMenu: [
                {
                    name: "All",
                    items: [
                        {
                            name: "Pre- School",
                        }
                    ]
                }
            ]
        },
        {
            name: "2nd Grade",
            lessons: 209
        },
        {
            name: "3rd Grade",
            lessons: 209
        },
    ],
    "class": {
    },
    "maker": {
    },
    "image bank": {
    },
    "offers": {
    },
    "more": {
    }
}
export const navData = [
    {
        name: "Academic",
        image: star,
        url: '/views/academic'
    },
    {
        name: "Early Career",
        image: arrow,
        url: '/views/early-career'
    },
    {
        name: "Edutainment",
        image: downArrow,
        url: '/views/edutainment'
    },
    {
        name: "Print Rich",
        image: gallery,
        url: '/views/print-rich'
    },
    {
        name: "Maker",
        image: maker,
        url: "/views/maker",
    },
    {
        name: "Info Hub",
        image: share,
        url: '/views/info-hub'
    },
];
export const menuItemsAcademics = [
    {
        title: "GRADE",
        url: "/",
        children: [
            {
                title: <div>1<sup>st</sup> Grade</div>,
                url: "",
                children: [
                    {
                        title: "All",
                        url: "/",
                        children: [{
                            heading : "Pre-School",
                            children : [
                                {
                                    title: 'Pre-School Shapes Worksheets ',
                                    url: '',
                                },
                                {
                                    title: 'Number And Pre-Math',
                                    url: '',
                                },
                                {
                                    title: 'Pre-School Concepts Worksheets',
                                    url: '',
                                },
                                {
                                    title: 'Pre-School Coloring Work Sheets',
                                    url: '',
                                },
                                {
                                    title: 'Pre-School Alphabet Worksheets',
                                    url: ''
                                },
                                {
                                    title: 'Pre-School Motor Skills',
                                    url: ''
                                },
                                {
                                    title: 'Worksheets',
                                    url: ''
                                }
                            ]
                        },
                        {
                            heading : "Pre Primary",
                            children : [
                                {
                                    title: 'Alphabet',
                                    url: '',
                                },
                                {
                                    title: 'Maths',
                                    url: '',
                                },
                                {
                                    title: 'Shapes',
                                    url: '',
                                },
                                {
                                    title: 'Colors',
                                    url: '',
                                },
                                {
                                    title: 'Basic Concepts',
                                    url: ''
                                },
                                {
                                    title: 'Phonics',
                                    url: ''
                                },
                                {
                                    title: 'Cursive Writing',
                                    url: ''
                                }
                            ]
                        },
                        {
                            heading : "Pre Primary",
                            children : [
                                {
                                    title: 'Alphabet',
                                    url: '',
                                },
                                {
                                    title: 'Maths',
                                    url: '',
                                },
                                {
                                    title: 'Shapes',
                                    url: '',
                                },
                                {
                                    title: 'Colors',
                                    url: '',
                                },
                                {
                                    title: 'Basic Concepts',
                                    url: ''
                                },
                                {
                                    title: 'Phonics',
                                    url: ''
                                },
                                {
                                    title: 'Cursive Writing',
                                    url: ''
                                }
                            ]
                        },
                        ],
                    },
                    {
                        title: "Cursive",
                        url: "/",
                        children: [{
                            heading : "Pre-School",
                            children : [
                                {
                                    title: 'Pre-School Shapes Worksheets ',
                                    url: '',
                                },
                                {
                                    title: 'Number And Pre-Math',
                                    url: '',
                                },
                                {
                                    title: 'Pre-School Concepts Worksheets',
                                    url: '',
                                },
                                {
                                    title: 'Pre-School Coloring Work Sheets',
                                    url: '',
                                },
                                {
                                    title: 'Pre-School Alphabet Worksheets',
                                    url: ''
                                },
                                {
                                    title: 'Pre-School Motor Skills',
                                    url: ''
                                },
                                {
                                    title: 'Worksheets',
                                    url: ''
                                }
                            ]
                        },]
                    },
                    {
                        title: "Maths",
                        url: "/",
                    },
                    {
                        title: "EVS",
                        url: "/",
                    },
                    {
                        title: "Activity",
                        url: "/",
                    },
                    {
                        title: "Art",
                        url: "/",
                    },
                    {
                        title: "Craft",
                        url: "/",
                    },
                    {
                        title: "Stories",
                        url: "/about",
                    },
                    {
                        title: "GK/IQ",
                        url: "/about",
                    },
                ]
            },
            {
                title: <div>1<sup>st</sup> Grade</div>,
                url: "",
                children: null
            },
            {
                title: <div>1<sup>st</sup> Grade</div>,
                url: "",
                children: null
            },
            {
                title: <div>1<sup>st</sup> Grade</div>,
                url: "",
                children: null
            },
            {
                title: <div>1<sup>st</sup> Grade</div>,
                url: "",
                children: null
            },
            {
                title: <div>1<sup>st</sup> Grade</div>,
                url: "",
                children: null
            }
        ]
    },
    {
        title: "CLASS",
        url: "/services",
        children: []
    },
    {
        title: "MAKERS",
        url: "/about",
        children: []
    },
    {
        title: "IMAGE BANK",
        url: "/",
        children: []
    },
    {
        title: "OFFERS",
        url: "/services",
        children: []
    },
    {
        title: "MORE",
        url: "/about",
        children: []
    }
];