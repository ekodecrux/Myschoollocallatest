import React, { useEffect } from "react";
import "./Header.css";
import { ReactComponent as MySchool } from "../../assests/logo.svg";
import { navData } from './constant'
// Import Menu Items
import { menuItemsAcademics } from "./menuItemsAcademics";
import { menuItemsEarlyCarrer } from "./menuItemsEarlyCarrer";
import { menuItemsEdutainment } from "./menuItemsEdutainment";
import { menuItemsInfoHub } from "./menuItemsInfoHub";
import { menuItemsPrintRich } from "./menuItemsPrintRich";
import Link from "@mui/material/Link";
import { AppBar, Drawer, Typography } from "@mui/material";
import Navbar from "./Navbar/Navbar";
import Menubar from "./Menubar/Menubar";
import MegaMenu from "./MegaMenu/Index";
import { useLocation } from "react-router-dom";
import DynamicBreadcrumb from "../../customTheme/breadcrumbs/breadcrumbs";
import home from "../../assests/homeScreen/home.svg";
import { useDispatch, useSelector } from "react-redux";
import { loadImages } from "../../redux/apiSlice";
import { isMobile as isMobileDevice } from "react-device-detect";
import MobileMenu from "./MobileMenu/MobileMenu";
import { menuItemsMakers } from "./menuItemsMakers";

// Custom hook to detect mobile view (combines user agent detection with viewport width)
const useMobileView = () => {
  const [isMobileViewport, setIsMobileViewport] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= 520 : false
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth <= 520);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobileDevice || isMobileViewport;
};

const Header = React.forwardRef((props, ref) => {
  const isMobile = useMobileView();
  const [selectedNavBar, setSelectedNavbar] = React.useState(null)
  const [selectedOverlayMenu, setSelectedOverlayMenu] = React.useState(null)
  const [selectedMegaMenuItem, setSelectedMegaMenuItem] = React.useState(0)
  const [menubarData, setMenubarData] = React.useState([])
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [menuItems, setMenuItems] = React.useState([])
  const [breadcrumbPad, setBreadcrumbPad] = React.useState(0)
  const { appType } = useSelector((state) => state.login);
  const headerLogoRef = React.useRef(null)
  const location = useLocation()
  const dispatch = useDispatch()
  // let menuItems = []
  React.useEffect(() => {
    setBreadcrumbPad(0.372 * headerLogoRef?.current?.clientWidth)
  }, [headerLogoRef?.current?.clientWidth])
  const getSearch = () => {
    let search = location.search.split("&")
    if (search.length === 2) {
      setSelectedNavbar(parseInt(search[0].match(/(\d+)/)[0]))        // Like Grade, class, etc
      setSelectedOverlayMenu(parseInt(search[1].match(/(\d+)/)[0]))       // Like Grade 1 and all
      handleMenubarData()
    }
  }
  useEffect(getSearch)
  const getMainRoute = () => {
    let path = location.pathname.split('/').filter(el => el).filter(el => el !== "views")
    // alert(path[0]);
    return path[0]
  }
  useEffect(() => {
    switch (getMainRoute().replace('-', '')) {
      case 'academic':
        setMenuItems(menuItemsAcademics.slice());
        break;
      case 'earlycareer':
        setMenuItems(menuItemsEarlyCarrer)
        break;
      case 'edutainment':
        setMenuItems(menuItemsEdutainment)
        break;
      case 'printrich':
        setMenuItems(menuItemsPrintRich)
        break;
      case 'maker':
        setMenuItems(menuItemsMakers)
        break;
      case 'infohub':
        setMenuItems(menuItemsInfoHub)
        break;
      default :
        setMenuItems(menuItemsAcademics.slice());
    }
  }, [])
  const ReturnFolderPath = () => {
    return `${getMainRoute().toUpperCase()}/${menuItems[selectedNavBar].title}/${menuItems[selectedNavBar]?.children[selectedOverlayMenu]?.title}/${menuItems[selectedNavBar]?.children[selectedOverlayMenu]?.children[selectedMegaMenuItem].title}`
  }
  // alert(path);
  // {path === "/views/academic" ?  }
  const handleMenubarData = () => {
    // {path == "/views/academic" ? () : ()}
    // var path = location.pathname.split('/').filter(el => el).filter(el => el !== "views")
    let data = menuItems[selectedNavBar]?.children[selectedOverlayMenu]?.children
    if (data && data.length !== 0 && data[0]?.title !== "All") {
      data.unshift({ title: "All", children: [...data] })
    }
    setMenubarData(data)
  }
  const handleImageFetch = (menuType, navbarIndex, overlayIndex) => {
    let path = `${getMainRoute().toUpperCase()}/thumbnails/${menuItems[selectedNavBar]?.title}/${menuItems[selectedNavBar]?.children[selectedOverlayMenu]?.title}/`
    if (navbarIndex !== undefined && overlayIndex !== undefined) {
      path = `${getMainRoute().toUpperCase()}/thumbnails/${menuItems[navbarIndex]?.title}/${menuItems[navbarIndex]?.children[overlayIndex]?.title}/`
    }
    let header = {
      "Content-Type": "application/json"
    }
    dispatch(loadImages({
      url: "/rest/images/fetch",
      header: header,
      method: "post",
      body: { folderPath: path, imagesPerPage: 50 }
    }));
  }
  const clearParams = () => {
    setSelectedNavbar(null)
    setSelectedOverlayMenu(null)
  }
  return (
    <>
      <AppBar elevation={0} ref={ref} position="fixed" className="headerContainer" >
        <div className="headerWrapper">
          <div className={isMobile ? "mobGutter" : "headerHomeGutter"} >
            <Link
              underline="hover"
              color="text.primary"
              href={appType === "none" ? "" : "/"}
              aria-current="page"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <img alt="" src={home} className="headerHomeLogo" style={{ display: isMobile ? 'none' : '' }} />
            </Link>
          </div>
          <div className="headerViewNavContainer">
            <div className="headerNavWrapper" >
              <div className="headerLogoContainer">
                <div className="headerBreadCrumbContainer" >
                  <Link href="/">
                    <MySchool ref={headerLogoRef} style={{ maxWidth: isMobile ? '310px' : '496px', maxHeight: '53px', paddingLeft: '4px' }}
                      className="headerMySchoolLogo" />
                  </Link>
                </div>
              </div>
              <span style={{ paddingLeft: breadcrumbPad }}>
                {isMobile ? null : <DynamicBreadcrumb />}
              </span>
            </div>
            <div className="navWrapper justifyContent">
              {navData.map((data, index) => (
                <Link
                  className="headerViewsNavLink"
                  underline="hover"
                  color="text.primary"
                  href={data.url}
                  aria-current="page"
                  key={`header-views-${index}`}
                >
                  <img alt="" src={data.image} className="headerImage" />
                  <Typography color="#494949" fontFamily={"Futura MD BT"} fontWeight={300} className="headerViewsNavLinkActive" >{data.name}</Typography>
                </Link>
              ))}
              <div className="headerViewsNavLinkHidden">
                <Link
                  className="headerViewsNavLink"
                  underline="hover"
                  color="text.primary"
                  href="/"
                  aria-current="page"
                // key={`header-views-${index}`}
                >
                  <Typography color="#494949" fontFamily={"Proxima Nova"} fontWeight={300} className="headerViewsNavLinkActive" ></Typography>
                </Link>
              </div>
              <div className="headerViewsNavLinkHidden">
                <Link
                  className="headerViewsNavLinkExtraIcon"
                  underline="hover"
                  color="text.primary"
                  href="/"
                  aria-current="page"
                >
                  <Typography color="#494949" fontFamily={"Proxima Nova"} fontWeight={300} className="headerViewsNavLinkActive" ></Typography>
                </Link>
              </div>
            </div>
          </div>
          <div className="homeGutter indiaFlag" />
        </div>
        <Navbar data={menuItems}
          handleSelectedNavbar={setSelectedNavbar}
          handleSetMenu={handleMenubarData}
          handleSetSelectedMenu={setSelectedMegaMenuItem}
          getPrevPath={ReturnFolderPath}
          handleImageFetch={handleImageFetch}
          mobileDrawer={setDrawerOpen}
          handleSelectedChild={setSelectedOverlayMenu} active={selectedNavBar} />
        {selectedNavBar !== 3 && !isMobile ? <Menubar active={selectedNavBar}
          data={menubarData}
          handleSelectedMenuItem={setSelectedMegaMenuItem} selected={selectedMegaMenuItem} /> : null}
      </AppBar>
      {selectedNavBar !== null && selectedOverlayMenu !== null &&
        menuItems[selectedNavBar]?.children[selectedOverlayMenu]?.children.length !== 0 && !isMobile ?
        <MegaMenu style={{ marginTop: 180 }}
          getPrevPath={ReturnFolderPath}
          categoryTitle={menuItems[selectedNavBar]?.children[selectedOverlayMenu]?.title}
          data={menuItems[selectedNavBar]?.children[selectedOverlayMenu]?.children ?
            menuItems[selectedNavBar]?.children[selectedOverlayMenu]?.children[selectedMegaMenuItem] : null} /> :
        <div style={{ marginTop: ref.current ? ref.current.clientHeight : 167 }}></div>}
      {isMobile ?
        <Drawer open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: "#494949",
              width: "95%"
            }
          }}>
          <MobileMenu
            clearParams={clearParams}
            menubarData={menubarData}
            selectedNavBar={selectedNavBar}
            selectedOverlayMenu={selectedOverlayMenu}
            getPrevPath={ReturnFolderPath}
            selectedMegaMenuItem={selectedMegaMenuItem}
            setSelectedMegaMenuItem={setSelectedMegaMenuItem}
            mobileDrawer={setDrawerOpen} />
        </Drawer> : null}
    </>
  );
})
export default Header;
        // <AllSubMenuContent />
        // <ScrollElement />