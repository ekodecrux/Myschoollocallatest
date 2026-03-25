import React, { Suspense, lazy } from "react";
import Home from "../components/homeScreen/Home";
import {
  BrowserRouter as Router,
  Routes as Nav,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import AuthViews from "../components/auth/views/Index";
import ImageScreen from "../components/auth/views/imageScreen/ImageScreen";
import Student from "../components/auth/views/student/Student";
import School from "../components/auth/views/school/School";
import ScreenInitializer from "../components/screens/Index";
// Pre login screens - Lazy loaded for performance
const Academics = lazy(() => import("../components/screens/academics/Academics"));
const EarlyCarrier = lazy(() => import("../components/screens/earlycarrier/EarlyCarriers"));
const InfoHub = lazy(() => import("../components/screens/infohub/InfoHub"));
const Publishing = lazy(() => import("../components/screens/publishing/Publishing"));
const Edutainment = lazy(() => import("../components/screens/edutainment/Edutainment"));
// Post login components
import Teacher from "../components/auth/views/teacher/Teacher";
import Profile from "../components/auth/views/profile/Profile";
import { useSelector } from "react-redux";
const Results = lazy(() => import("../components/screens/results/Results"));
import Faqs from "../components/auth/views/faqs/FAQS";
import AddNewSchool from "../components/auth/views/school/addNewSchool/AddNewSchool";
import AddNewStudent from "../components/auth/views/student/addNewStudent/AddNewStudent";
import AddNewTeacher from "../components/auth/views/teacher/addNewTeacher/AddNewTeacher";
import Subscription from "../components/auth/views/subscription/Subscription";
import Help from "../components/auth/views/help/Help";
// Makers - Lazy loaded for performance
const ChartMaker = lazy(() => import("../components/makers/chartMaker/chartMaker"));
const MicroScheduler = lazy(() => import("../components/makers/microScheduler/MicroScheduler"));
const WorksheetMaker = lazy(() => import("../components/makers/worksheetMaker/WorksheetMaker"));
const StoryMaker = lazy(() => import("../components/makers/storyMaker/StoryMaker"));
import Makers from "../components/makers/makers";
import ComingSoon from "../components/makers/ComingSoon";
import Unauthorize from "../components/screens/unauthorize/Unauthorize";
const Sections = lazy(() => import("../components/screens/sections/Sections"));
import Privacy from '../components/footerComponents/privacy/privacy'
import Terms from '../components/footerComponents/terms/Terms'
import Cookies from '../components/footerComponents/cookies/Cookies'
import FooterHelp from '../components/footerComponents/help/FooterHelp'
import ErrorBoundary from '../components/common/ErrorBoundary'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ProtectedMakerRoute from '../components/common/ProtectedMakerRoute'
import Launch from "../Launch";
const Analytics = lazy(() => import("../components/auth/views/analytics/analytics"));
const Maker = lazy(() => import("../components/screens/maker/Maker"));
import Authorize from "../components/screens/authorize/Authorize";
// Admin Panel - Lazy loaded for performance
const AdminPanel = lazy(() => import("../components/admin/AdminPanel"));
// Session timeout hook
import useSessionTimeout from "../hook/useSessionTimeout";

// Loading fallback component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <LoadingSpinner />
  </div>
);

// Session timeout wrapper component
const SessionTimeoutWrapper = ({ children }) => {
  useSessionTimeout();
  return children;
};

const Routes = () => {
  const { isLoggedin, userRole } = useSelector((state) => state.login);
  return (
    <Router>
      <SessionTimeoutWrapper>
      <Suspense fallback={<PageLoader />}>
      <Nav>
        <Route path="/launch" element={<Launch />} />
        <Route path="/" element={<Home />} />
        {/* </Route> */}
        <Route path="/views" element={<ScreenInitializer />}>
          <Route path="/views/academic" element={<Academics />}>
            <Route path="/views/academic/:navbarMenuItem/:navbarMenuSubItem/:navbarMenuThirdItem" element={<Academics />} />
            <Route path="/views/academic/:navbarMenuItem/:navbarMenuSubItem" element={<Academics />} />
            <Route path="/views/academic/:navbarMenuItem" element={<Academics />} />
          </Route>
          <Route path="/views/privacy" element={<Privacy />} />
          <Route path="/views/terms" element={<Terms />} />
          <Route path="/views/cookies" element={<Cookies />} />
          <Route path="/views/help" element={<FooterHelp />} />
          <Route path="/views/print-rich/makers" element={<ProtectedMakerRoute><Makers /></ProtectedMakerRoute>}>
            <Route path="/views/print-rich/makers" index element={<ProtectedMakerRoute><Makers /></ProtectedMakerRoute>} />
            <Route path="/views/print-rich/makers/chart-maker" element={<ProtectedMakerRoute><ChartMaker /></ProtectedMakerRoute>} />
            <Route path="/views/print-rich/makers/micro-scheduler" element={<ProtectedMakerRoute><MicroScheduler /></ProtectedMakerRoute>} />
            <Route path="/views/print-rich/makers/worksheet-maker" element={<ProtectedMakerRoute><WorksheetMaker /></ProtectedMakerRoute>} />
            <Route path="/views/print-rich/makers/story-maker" element={<ProtectedMakerRoute><StoryMaker /></ProtectedMakerRoute>} />
            <Route path="/views/print-rich/makers/:navbarMenuItem" element={<ProtectedMakerRoute><ComingSoon /></ProtectedMakerRoute>} />
          </Route>
          <Route path="/views/academic/makers" element={<ProtectedMakerRoute><Makers /></ProtectedMakerRoute>}>
            <Route path="/views/academic/makers" index element={<ProtectedMakerRoute><Makers /></ProtectedMakerRoute>} />
            <Route path="/views/academic/makers/chart-maker" element={<ProtectedMakerRoute><ChartMaker /></ProtectedMakerRoute>} />
            <Route path="/views/academic/makers/micro-scheduler" element={<ProtectedMakerRoute><MicroScheduler /></ProtectedMakerRoute>} />
            <Route path="/views/academic/makers/worksheet-maker" element={<ProtectedMakerRoute><WorksheetMaker /></ProtectedMakerRoute>} />
            <Route path="/views/academic/makers/story-maker" element={<ProtectedMakerRoute><StoryMaker /></ProtectedMakerRoute>} />
            <Route path="/views/academic/makers/:searchQuery" element={<ProtectedMakerRoute><ComingSoon /></ProtectedMakerRoute>} />
          </Route>
           <Route path="/views/early-career/makers" element={<ProtectedMakerRoute><Makers /></ProtectedMakerRoute>}>
            <Route path="/views/early-career/makers" index element={<ProtectedMakerRoute><Makers /></ProtectedMakerRoute>} />
            <Route path="/views/early-career/makers/chart-maker" element={<ProtectedMakerRoute><ChartMaker /></ProtectedMakerRoute>} />
            <Route path="/views/early-career/makers/micro-scheduler" element={<ProtectedMakerRoute><MicroScheduler /></ProtectedMakerRoute>} />
            <Route path="/views/early-career/makers/worksheet-maker" element={<ProtectedMakerRoute><WorksheetMaker /></ProtectedMakerRoute>} />
            <Route path="/views/early-career/makers/story-maker" element={<ProtectedMakerRoute><StoryMaker /></ProtectedMakerRoute>} />
            <Route path="/views/early-career/makers/:navbarMenuItem" element={<ProtectedMakerRoute><ComingSoon /></ProtectedMakerRoute>} />
          </Route>
           <Route path="/views/edutainment/makers" element={<ProtectedMakerRoute><Makers /></ProtectedMakerRoute>}>
            <Route path="/views/edutainment/makers" index element={<ProtectedMakerRoute><Makers /></ProtectedMakerRoute>} />
            <Route path="/views/edutainment/makers/chart-maker" element={<ProtectedMakerRoute><ChartMaker /></ProtectedMakerRoute>} />
            <Route path="/views/edutainment/makers/micro-scheduler" element={<ProtectedMakerRoute><MicroScheduler /></ProtectedMakerRoute>} />
            <Route path="/views/edutainment/makers/worksheet-maker" element={<ProtectedMakerRoute><WorksheetMaker /></ProtectedMakerRoute>} />
            <Route path="/views/edutainment/makers/story-maker" element={<ProtectedMakerRoute><StoryMaker /></ProtectedMakerRoute>} />
            <Route path="/views/edutainment/makers/:navbarMenuItem" element={<ProtectedMakerRoute><ComingSoon /></ProtectedMakerRoute>} />
          </Route>  
          <Route path="/views/early-career" element={<EarlyCarrier />}>
            <Route path="/views/early-career/:navbarMenuItem/:navbarMenuSubItem" element={<EarlyCarrier />} />
            <Route path="/views/early-career/:navbarMenuItem" element={<EarlyCarrier />} />
          </Route>
          <Route path="/views/edutainment" element={<Edutainment />}>
            <Route path="/views/edutainment/:navbarMenuItem/:navbarMenuSubItem" element={<Edutainment />} />
            <Route path="/views/edutainment/:navbarMenuItem" element={<Edutainment />} />
          </Route>
          <Route path="/views/print-rich" element={<Publishing />}>
            <Route path="/views/print-rich/:navbarMenuItem/:navbarMenuSubItem" element={<Publishing />} />
            <Route path="/views/print-rich/:navbarMenuItem" element={<Publishing />} />
          </Route>
          <Route path="/views/maker" element={<ProtectedMakerRoute><Maker /></ProtectedMakerRoute>}></Route>
          <Route path="/views/maker/makers" element={<ProtectedMakerRoute><Makers /></ProtectedMakerRoute>}>
            <Route path="/views/maker/makers" index element={<ProtectedMakerRoute><Makers /></ProtectedMakerRoute>} />
            <Route path="/views/maker/makers/:navbarMenuItem" element={<ProtectedMakerRoute><ErrorBoundary><ChartMaker /></ErrorBoundary></ProtectedMakerRoute>} />
            <Route path="/views/maker/makers/micro-scheduler" element={<ProtectedMakerRoute><ErrorBoundary><MicroScheduler /></ErrorBoundary></ProtectedMakerRoute>} />
            <Route path="/views/maker/makers/worksheet-maker" element={<ProtectedMakerRoute><ErrorBoundary><WorksheetMaker /></ErrorBoundary></ProtectedMakerRoute>} />
            <Route path="/views/maker/makers/story-maker" element={<ProtectedMakerRoute><ErrorBoundary><StoryMaker /></ErrorBoundary></ProtectedMakerRoute>} />
          </Route>
          <Route path="/views/info-hub" element={<InfoHub />}>
            <Route path="/views/info-hub/:navbarMenuItem/:navbarMenuSubItem" element={<InfoHub />} />
            <Route path="/views/info-hub/:navbarMenuItem" element={<InfoHub />} />
          </Route>
          <Route path="/views/result" element={<Results />}></Route>
          <Route path="/views/sections/:navbarMenuItem/:navbarMenuSubItem" element={<Sections />} />
          <Route path="/views/sections/:navbarMenuItem" element={<Sections />} />
          <Route path="/views/sections" element={<Sections />} />
        </Route>
        <Route path="/unauthorized" element={<Unauthorize />} />
        <Route path="/authorized" element={<Authorize />} />
        {/* After Login Routes */}
        {isLoggedin ? (
          <Route path="/auth" element={<AuthViews />}>
            <Route path="/auth" index element={<Profile />} />
            <Route path="/auth/image" element={<Navigate to={"/auth"} />} />
            <Route path="/auth/school" element={<School />} />
            <Route path="/auth/student" element={<Student />} />
            <Route path="/auth/teacher" element={<Teacher />} />
            <Route path="/auth/images" element={<ImageScreen />} />
            <Route path="/auth/subscription" element={<Subscription />} />
            <Route path="/auth/faq" element={<Faqs />} />
            <Route path="/auth/school/addnewschool" element={<AddNewSchool />} />
            <Route path="/auth/student/addnewstudent" element={<AddNewStudent />} />
            <Route path="/auth/teacher/addnewteacher" element={<AddNewTeacher />} />
            <Route path="/auth/subscription" element={<Subscription />} />
            <Route path="/auth/help" element={<Help />} />
            <Route path="/auth/analytics" element={<Analytics />} />
            <Route path="/auth/admin" element={<AdminPanel />} />
            <Route path="/auth/dashboard" element={<AdminPanel />} />
            <Route path="/auth/schools" element={<AdminPanel />} />
            {/* <Route path="/auth/calendar" element={<MicroScheduler />} /> */}
            {/* <Route path="/auth" element={<MyImages />} />
            <Route path="/auth" element={<MyImages />} />
            <Route path="/auth" element={<MyImages />} /> */}
          </Route>
        ) : (
          <Route path="/auth" element={<Navigate to="/" />} >
            <Route path="/auth/:internalRoutes" element={<Navigate to={"/auth"} />} />
          </Route>
        )}
      </Nav>
      </Suspense>
      </SessionTimeoutWrapper>
    </Router>
  );
};
export default Routes;
