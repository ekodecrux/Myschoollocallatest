import { ReactComponent as SchoolIcon } from "../../../../assests/auth/schoolIcon.svg"
import { ReactComponent as ProfileIcon } from "../../../../assests/auth/profileIcon.svg"
import { ReactComponent as ImageIcon } from "../../../../assests/auth/imagesIcon.svg"
import { ReactComponent as StudentIcon } from "../../../../assests/auth/studentsIcon.svg"
import { ReactComponent as FaqIcon } from "../../../../assests/auth/faqIcon.svg"
import { ReactComponent as HelpIcon } from "../../../../assests/auth/helpIcon.svg"
import { ReactComponent as SubscriptionIcon } from "../../../../assests/auth/subscriptionIcon.svg"
import { ReactComponent as TeachersIcon } from "../../../../assests/auth/teachersIcon.svg"
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
export const navigationData = [
    {
        name: "ACCOUNT",
        children: [
            {
                name: "My Profile",
                url: "/auth",
                icon: <ProfileIcon />,
                role: ['EVERYONE']
            },
            {
                name: "Subscriptions",
                url: "/auth/subscription",
                icon: <SubscriptionIcon />,
                role: ['EVERYONE']
            },
        ]
    },
    {
        name: "Dashboard",
        children: [{
            name: "Images",
            url: "/auth/images",
            icon: <ImageIcon />,
            role: ['EVERYONE']
        },
        {
            name: "Analytics",
            url: "/auth/analytics",
            icon: <ImageIcon />,
            role: ['SCHOOL_ADMIN', 'SUPER_ADMIN']
        },
        {
            name: "Schools",
            url: "/auth/school",
            icon: <SchoolIcon />,
            role: ['SUPER_ADMIN']
        },
        {
            name: "Teachers",
            url: "/auth/teacher",
            icon: <TeachersIcon />,
            role: ['SCHOOL_ADMIN', 'SUPER_ADMIN']
        },
        {
            name: "Students",
            url: "/auth/student",
            icon: <StudentIcon />,
            role: ['SCHOOL_ADMIN', "TEACHER", 'SUPER_ADMIN']
        },
        // {
        //     name: "Calendar",
        //     url: "/auth/calendar",
        //     icon: <ImageIcon />,
        //     role: ['SCHOOL', 'TEACHER', 'STUDENT']
        // }
        ]
    },
    {
        name: "SUPPORT",
        children: [{
            name: "Help",
            url: "/auth/help",
            icon: <HelpIcon />,
            role: ['EVERYONE']
        },
        {
            name: "FAQs",
            url: "/auth/faq",
            icon: <FaqIcon />,
            role: ['EVERYONE']
        }
        ]
    },
]