import { isMobile } from "react-device-detect"
import Cbse from "../../assests/homeScreen/govtInitiatives/cbseSchoolList"
import TeachingGuideline from '../../assests/homeScreen/govtInitiatives/flnTeachingGuidelines'
import GameBased from '../../assests/homeScreen/govtInitiatives/gameBasedLearning'
import GoalBased from '../../assests/homeScreen/govtInitiatives/goalBasedLearning'
import GovtNotification from '../../assests/homeScreen/govtInitiatives/govtNotifications'
import Grants from '../../assests/homeScreen/govtInitiatives/grantsForMarit'
import StateBoard from "../../assests/homeScreen/govtInitiatives/stateBoardSchools";
import StateWiseTextBooks from "../../assests/homeScreen/govtInitiatives/stateWiseTextBooks";
import ThemeBasedLearning from "../../assests/homeScreen/govtInitiatives/themeBasedLearning";
import UdlBasedLearning from "../../assests/homeScreen/govtInitiatives/udlBasedLearning";
export const govImageData = [
  [
    {image: <ThemeBasedLearning width={isMobile ? "80vw": "18vw"} />, hoverImage: <ThemeBasedLearning width={isMobile ? "80vw": "18vw"} inverted />, label:''},
    { image: <GoalBased width={isMobile ? "80vw": "18vw"}/>, hoverImage: <GoalBased width={isMobile ? "80vw": "18vw"} inverted/>, label:''  },
    { image: <GameBased width={isMobile ? "80vw": "18vw"}/>, hoverImage: <GameBased width={isMobile ? "80vw": "18vw"} inverted/>, label:''  },
    { image: <TeachingGuideline width={isMobile ? "80vw": "18vw"}/>, hoverImage: <TeachingGuideline width={isMobile ? "80vw": "18vw"} inverted/>, label:'' },
    { image: <UdlBasedLearning width={isMobile ? "80vw": "18vw"}/>, hoverImage: <UdlBasedLearning width={isMobile ? "80vw": "18vw"} inverted/>, label:''  },
  ],
  [
    { image: <GovtNotification width={isMobile ? "80vw": "18vw"}/>, hoverImage: <GovtNotification width={isMobile ? "80vw": "18vw"} inverted/>, label:'' },
    { image: <Cbse width={isMobile ? "80vw": "18vw"}/>, hoverImage: <Cbse width={isMobile ? "80vw": "18vw"} inverted/>, label:'', type: 'component'  },
    { image: <StateWiseTextBooks width={isMobile ? "80vw": "18vw"}/>, hoverImage: <StateWiseTextBooks width={isMobile ? "80vw": "18vw"} inverted/>,label:''},
    { image: <Grants width={isMobile ? "80vw": "18vw"}/>, hoverImage: <Grants width={isMobile ? "80vw": "18vw"} inverted/>, label:''  },
    { image: <StateBoard width={isMobile ? "80vw": "18vw"}/>, hoverImage: <StateBoard width={isMobile ? "80vw": "18vw"} inverted/>, label:''},
  ],
];
