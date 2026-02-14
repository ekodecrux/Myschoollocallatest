import { ReactComponent as ArrowComponent } from "../../assests/homeScreen/arrow.svg";
import { ReactComponent as DownArrowComponent } from "../../assests/homeScreen/downarrow.svg";
import { ReactComponent as GalleryComponent } from "../../assests/homeScreen/gallery.svg";
import { ReactComponent as StarComponent } from "../../assests/homeScreen/star.svg";
import { ReactComponent as ShareComponent } from "../../assests/homeScreen/share.svg";
import { ReactComponent as MakerComponent} from "../../assests/homeScreen/makerLogo.svg";
import arrow from "../../assests/homeScreen/arrow.svg";
import downArrow from "../../assests/homeScreen/downarrow.svg";
import gallery from "../../assests/homeScreen/gallery.svg";
import star from "../../assests/homeScreen/star.svg";
import share from "../../assests/homeScreen/share.svg";
import maker from "../../assests/homeScreen/makerLogo.svg";
import SearchIcon from '../../assests/homeScreen/SearchIcon.json'
import BlackBox from "../../assests/homeScreen/ServiceIcons/blackBox";
import BlueBox from "../../assests/homeScreen/ServiceIcons/blueBox";
import BrownBox from "../../assests/homeScreen/ServiceIcons/brownBox";
import GreenBox from "../../assests/homeScreen/ServiceIcons/greenBox";
import OrangeBox from "../../assests/homeScreen/ServiceIcons/orangeBox";
import PinkBox from "../../assests/homeScreen/ServiceIcons/pinkBox";
import RedBox from "../../assests/homeScreen/ServiceIcons/redBox";
import VoiletBox from "../../assests/homeScreen/ServiceIcons/violetBox";
import YellowBox from "../../assests/homeScreen/ServiceIcons/yellowBox";
import GrayBox from "../../assests/homeScreen/ServiceIcons/greyBox";
import Yellowbox from "../../assests/homeScreen/ServiceIcons/yellowBox";
import Bluebox from "../../assests/homeScreen/ServiceIcons/blueBox";
import Pinkbox from "../../assests/homeScreen/ServiceIcons/pinkBox";
import Graybox from "../../assests/homeScreen/ServiceIcons/greyBox";
import Brownbox from "../../assests/homeScreen/ServiceIcons/brownBox";
// import Redbox from "../../assests/homeScreen/ServiceIcons/OrrangeBox";
export const lottieOptions = {
    loop: true,
    autoplay: true,
    animationData: SearchIcon,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};
export const navData = [
    {
        image: star,
        name: "Academic",
        url: "/views/academic",
        mobileImage: <StarComponent width="40px" />
    },
    {
        image: arrow,
        name: "Early Career",
        url: "/views/early-career",
        mobileImage: <DownArrowComponent width="40px" />
    },
    {
        image: downArrow,
        name: "Edutainment",
        url: "/views/edutainment",
        mobileImage: <ArrowComponent width="40px" />
    },
    {
        image: gallery,
        name: "Print Rich",
        url: "/views/print-rich",
        mobileImage: <GalleryComponent width="40px" />
    },
    {
        image: maker,
        name: "Maker",
        url: "/views/maker",
        mobileImage: <MakerComponent width="40px" />
    },
    {
        image: share,
        name: "Info Hub",
        url: "/views/info-hub",
        mobileImage: <ShareComponent width="40px" />
    },
];
export const serviceCenterIconsData = [
    [{
        image: <RedBox width='10vw'/>,
        hoverImage: <RedBox width='10vw' inverted />,
        url:'/views/academic'
    },
    {
        image: <YellowBox width='10vw' />,
        hoverImage: <YellowBox width='10vw' inverted />,
        url:'/views/early-career'
    },
    {
        image: <BlueBox width='10vw' />,
        hoverImage: <BlueBox width='10vw' inverted />,
        url:'/views/edutainment'
    },
    {
        image: <PinkBox width='10vw' />,
        hoverImage: <PinkBox width='10vw' inverted />,
        url:'/views/printrich'
    },
    {
        image: <GrayBox width='10vw' />,
        hoverImage: <GrayBox width='10vw' inverted />,
        url:'/views/maker'
    },
    ],
    [
        { image: <BrownBox width='10vw' />, hoverImage: <BrownBox width='10vw' inverted />,url:'/views/info-hub' },
        { image: <VoiletBox width='10vw' />, hoverImage: <VoiletBox width='10vw' inverted />,url:'/views/info-hub' },
        { image: <GreenBox width='10vw' />, hoverImage: <GreenBox width='10vw' inverted />,url:'/views/info-hub' },
        { image: <OrangeBox width='10vw' />, hoverImage: <OrangeBox width='10vw' inverted />,url:'/views/info-hub' },
        { image: <BlackBox width='10vw' />, hoverImage: <BlackBox width='10vw' inverted />,url:'/views/printrich/makers' },
    ]
]
export const mobileserviceCenterIconsData = [
    {
        image: <RedBox width='40vw'/>,
        hoverImage: <RedBox width='40vw' inverted />,
        url:'/views/academic'
    },
    {
        image: <YellowBox width='40vw' />,
        hoverImage: <Yellowbox width='40vw' inverted />,
        url:'/views/early-career'
    },
    {
        image: <BlueBox width='40vw' />,
        hoverImage: <Bluebox width='40vw' inverted />,
        url:'/views/edutainment'
    },
    {
        image: <PinkBox width='40vw' />,
        hoverImage: <Pinkbox width='40vw' inverted />,
        url:'/views/printrich'
    },
    {
        image: <GrayBox width='40vw' />,
        hoverImage: <Graybox width='40vw' inverted />,
        url:'/views/maker'
    },
        { image: <BrownBox width='40vw' />, hoverImage: <Brownbox width='40vw' inverted />, url:'/views/info-hub' },
        { image: <VoiletBox width='40vw' />, hoverImage: <VoiletBox width='40vw' inverted />, url:'/views/info-hub' },
        { image: <GreenBox width='40vw' />, hoverImage: <GreenBox width='40vw' inverted />, url:'/views/info-hub' },
        { image: <OrangeBox width='40vw' />, hoverImage: <OrangeBox width='40vw' inverted />, url:'/views/info-hub' },
        { image: <BlackBox width='40vw' />, hoverImage: <BlackBox width='40vw' inverted />, url:'/views/printrich/makers' },
    ]
