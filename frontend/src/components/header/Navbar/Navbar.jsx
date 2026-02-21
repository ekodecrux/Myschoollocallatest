import React from "react";
import "./Navbar.css";
import {
  Button,
  Menu,
  MenuItem,
  Fade,
  Link,
  Typography,
  AccordionDetails,
  IconButton,
  Tooltip,
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import { renderToString } from "react-dom/server";
import { isMobile as isMobileDevice } from "react-device-detect";
import home from "../../../assests/homeScreen/home.svg";
import hamburgerIcon from "../../../assests/header/hamburger.svg";
import DynamicBreadcrumb from "../../../customTheme/breadcrumbs/breadcrumbs";
// Accordians for Mobile Menus
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { languageOptions } from "./Constant";
import { useSelector } from "react-redux";

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

  // Return true if either user agent detection OR viewport width indicates mobile
  return isMobileDevice || isMobileViewport;
};

const Navbar = (props) => {
  const isMobile = useMobileView();
  const [anchorEl, setAnchorEl] = React.useState(
    new Array(props.data.length).fill(null)
  ); // dynamically add array according to length of data
  const [expanded, setExpanded] = React.useState(false);
  const { appType } = useSelector((state) => state.login);
  // Mobile Menu Main Accordion
  const location = useLocation();
  let pathName = location.pathname.split("/");
  // Function handle on click event for navbar menu clicked
  // handle anchoring of overlay menus with the navbar menu btn
  // @param (event, index of menu clicked)
  const handleClick = (event, index) => {
    const newAnchorEl = [...anchorEl];
    newAnchorEl[index] = event.target;
    setAnchorEl(newAnchorEl);
  };
  // Function handle on close events for closing or de anchoring
  // menus overlays
  // @param (index of menu to be close or mounted menu)
  const handleClose = (index) => {
    const newAnchorEl = [...anchorEl];
    newAnchorEl[index] = null;
    setAnchorEl(newAnchorEl);
  };
  // Function handle selected items of menus
  // @param (index of parent in navbar, index of parent child selected)
  const handleItemsClick = (navIndex, childIndex, title) => {
    props.handleSelectedNavbar(navIndex); // Like Grade, class, etc
    props.handleSelectedChild(childIndex); // Like Grade 1 and all
    // if (title === "Chart Maker") {
    //   handleClose(navIndex);
    // } else {
    props.handleSetSelectedMenu(0);
    props.handleSetMenu();
    props.handleImageFetch("navbar", navIndex, childIndex);
    handleClose(navIndex);
    // }
  };
  const getCurrentPath = () => {
    let pathName = location.pathname.split("/");
    return pathName;
  };
  
  // Get the correct base path for navigation
  // If current path is a special page (privacy, result, terms, etc), default to 'academic'
  const getNavigationBasePath = () => {
    const currentPath = getCurrentPath()[2];
    const validBasePaths = ['academic', 'early-career', 'edutainment', 'print-rich', 'maker', 'info-hub', 'sections'];
    if (validBasePaths.includes(currentPath)) {
      return currentPath;
    }
    return 'academic';  // Default to academic for special pages
  };
  const removeHTML = (str) => {
    str = renderToString(str.title)
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(" ", "-")
      .toLowerCase();
    return str;
  };
  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };
  const [anchorLanguageEl, setAnchorLanguageEl] = React.useState(null);
  const opened = Boolean(anchorLanguageEl);
  const handleLanguageClick = (event) => {
    setAnchorLanguageEl(event.currentTarget);
  };
  const handleLanguageClose = () => {
    setAnchorLanguageEl(null);
  };
  const navLanguageOptions = () => {
    return (
      <div className="navLanguageOptions">
        {languageOptions.map((key, index) => {
          return (
            <MenuItem key={`nav-lang-${index}`} className="navLanguageRender">
              <Link
                to={key.url}
                className="navLanguageOptionsLink"
              >
                <Typography color='White' fontFamily="Roboto" fontWeight={100} fontSize='14px'>{key.name.toUpperCase()}</Typography>
              </Link>
            </MenuItem>
          );
        })}
      </div>
    );
  };
  return (
    <div
      className="navbarMenuDiv"
    // style={
    //   isMobile
    //     ? { maxHeight: "calc(100vh - 230px)", overflowY: "auto" }
    //     : null
    // }
    >
      <div className={isMobile ? "mobGutter" : opened ? "navbarHomeGutterOpened" : "navbarHomeGutter"}>
        {isMobile ? null : (
          <div className="languageMainContainer">
            <IconButton
              className="languageButtonIcon"
              id="avatarBtn"
              aria-controls={opened ? "basic-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={
                opened ? "true" : undefined}
              onClick={handleLanguageClick}
            >
              <Typography className="languageButton" fontSize={17} padding='5px' 
                style={{display: opened ? 'none' :'flex'}}>
                L
              </Typography>
            </IconButton>
            {opened ? <div className="navLanguageHeading">
              {/* <Typography className="languageButton" fontSize="16px">L</Typography> */}
              <Typography className="navLanguageTypo" color='white' fontFamily="sans-serif" fontSize='15px' padding='5px'>LANGUAGE</Typography>
            </div> : null}
            <Menu style={{ boxShadow: 'none', maxHeight: '70vh', fontSize: '15px' }}
              classes={{ paper: "languageMenu" }}
              anchorEl={anchorLanguageEl}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              open={opened}
              sx={{
                ".MuiMenu-paper": {
                  background: 'linear-gradient(rgb(215 18 117) 0%, rgb(217 27 122 / 42%) 100%) 0% 0% no-repeat padding-box padding-box transparent !important',
                  // backgroundColor:' #ffdaec',
                  boxShadow: "none",
                  //  borderRadius: "0px 0px 8px 8px",
                  opacity: 1,
                  color: "black",
                  marginLeft: "63.45px",
                  borderRadius: "0px 8px 8px",
                  top: '122px !important'
                },
              }}
              onClose={handleLanguageClose}
              MenuListProps={{
                "aria-labelledby": "avatarBtn",
              }}
            >
              {navLanguageOptions()}
            </Menu>
          </div>
        )}
      </div>
      {isMobile && props.overlay === undefined ? (
        <div className="mobNavbarMenu">
          <div className="icon" style={{ display: "flex", flex: 1, gap: '10px', alignItems: 'center' }}>
            <Link
              underline="hover"
              color="text.primary"
              href="/"
              aria-current="page"
              style={{display : appType !== "none" ? "none" : "flex"}}
            >
              <img alt="" src={home} style={{ width: '31px', paddingTop: '6px' }} />
            </Link>
            <div 
              onClick={() => props.mobileDrawer(true)} 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flex: 1 }}
            >
              <DynamicBreadcrumb color={"white"} />
            </div>
          </div>
          {appType === "none" ? (
            <div
              onClick={() => props.mobileDrawer(true)}
              className="hamburgerIcon"
              style={{ cursor: 'pointer', padding: '8px' }}
            >
              <img src={hamburgerIcon} alt="Menu" />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                onClick={() => props.mobileDrawer(true)}
                className="hamburgerIcon"
                style={{ cursor: 'pointer', padding: '8px' }}
              >
                <img src={hamburgerIcon} alt="Menu" />
              </div>
              <div 
                onClick={() => window.flutter_inappwebview?.callHandler('closeWebView', '*')}
                style={{ cursor: 'pointer', padding: '8px' }}
              >
                <Typography>Back to App</Typography>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {isMobile && props.overlay === undefined ? null :
        <>
          <nav className="navbarMenu" style={props?.overlay ? { flex: 1 } : null}>
            {!props?.overlay ? (
              <ul
                className="menus"
                style={
                  props.overlay
                    ? { flexDirection: "column", alignItems: "flex-start" }
                    : {}
                }
              >
                {props.data.map((k, i) => {
                  return (
                    <div key={`mid-header-${i}`} style={{ height: "100%" }}>
                      <Button
                        disabled={k?.title.toLowerCase() === "more"}
                        aria-controls={
                          Boolean(anchorEl[i])
                            ? `fade-${k.title}-${i}`
                            : undefined
                        }
                        aria-haspopup="true"
                        sx={{
                          "&:hover": {
                            backgroundColor: "black",
                          },
                          "&:active": {
                            backgroundColor: "black",
                          },
                          "&": {
                            width: props.overlay
                              ? "unset"
                              : pathName[2] === "early-career"
                                ? "160px"
                                : "125px",
                          },
                        }}
                        className={[
                          Boolean(anchorEl[i]) ? "navbarMenuActive" : null,
                          props.active === i ? "selectedActive" : null,
                        ].join(" ")}
                        style={{
                          color: "white",
                          fontFamily: ("Roboto", "sans-serif"),
                          fontSize: 15,
                          height: "100%",
                        }}
                        aria-expanded={Boolean(anchorEl[i]) ? "true" : undefined}
                        onClick={(e) => handleClick(e, i)}
                      >
                        {k.title}
                      </Button>
                      <Menu
                        id={`fade-${k.title}-${i}`}
                        MenuListProps={{
                          "aria-labelledby": "fade-button",
                        }}
                        classes={{ paper: "navbarMenuPaper" }}
                        anchorEl={anchorEl[i]}
                        open={Boolean(anchorEl[i])}
                        onClose={() => handleClose(i)}
                        TransitionComponent={Fade}
                        elevation={0}
                      >
                        {k.children
                          .sort((a, b) => a.title < b.title)
                          .map((ck, ci) => 
                            ck.disable ? (
                              <Tooltip title="Coming Soon" placement="right" key={`mid-header-disabled-${i}-${ci}`}>
                                <MenuItem
                                  style={{ 
                                    paddingLeft: 25, 
                                    paddingRight: 25, 
                                    opacity: 0.6,
                                    cursor: 'not-allowed'
                                  }}
                                  className="navbarMenuItem"
                                  disabled
                                >
                                  <Typography
                                    fontFamily={"Roboto"}
                                    fontWeight={200}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                  >
                                    {ck.title}
                                    <span style={{ 
                                      fontSize: '9px', 
                                      backgroundColor: '#ff9800', 
                                      color: '#fff',
                                      padding: '2px 6px', 
                                      borderRadius: '4px',
                                      fontWeight: 500
                                    }}>Soon</span>
                                  </Typography>
                                </MenuItem>
                              </Tooltip>
                            ) : (
                            <NavLink
                              key={`mid-header-${i}-${ci}`}
                              style={{ textDecoration: "none" }}
                              exact="true"
                              className="navbarMenuLink"
                              to={{
                                    pathname: (() => {
                                      const parentNormalized = k.title.toLowerCase().replace(/[\s-]/g, '');
                                      const childPath = removeHTML(ck);
                                      const currentBasePath = getNavigationBasePath();
                                      
                                      // Handle Image Bank navigation based on current section
                                      if (parentNormalized === 'imagebank') {
                                        // Academic section uses /views/academic/imagebank/[category]
                                        if (currentBasePath === 'academic') {
                                          return `/views/academic/imagebank/${childPath}`;
                                        }
                                        // Other sections (print-rich, sections) use /views/sections/image-bank/[category]
                                        return `/views/sections/image-bank/${childPath}`;
                                      }
                                      
                                      const academicOnlyTabs = ['class', 'grade'];
                                      const effectiveBasePath = academicOnlyTabs.includes(parentNormalized) ? 'academic' : currentBasePath;
                                      const basePath = `/views/${effectiveBasePath}/${k.title.toLowerCase().replace(' ', '-')}`;
                                      // Don't add child path if it's essentially the same as parent
                                      const childNormalized = childPath.toLowerCase().replace(/[\s-]/g, '');
                                      if (parentNormalized === childNormalized) {
                                        return basePath;
                                      }
                                      return `${basePath}/${childPath}`;
                                    })(),
                                    search: `?main=${i}&mu=${ci}`,
                                  }}
                            >
                              <MenuItem
                                style={{ paddingLeft: 25, paddingRight: 25 }}
                                className="navbarMenuItem"
                                onClick={() => {
                                    handleItemsClick(i, ci, ck.title);
                                }}
                              >
                                <Typography
                                  fontFamily={"Roboto"}
                                  fontWeight={200}
                                >
                                  {ck.title}
                                </Typography>
                              </MenuItem>
                            </NavLink>
                            )
                          )}
                      </Menu>
                    </div>
                  );
                })}
              </ul>
            ) : (
              <ul
                className="menus"
                style={
                  props.overlay
                    ? { flexDirection: "column", alignItems: "flex-start" }
                    : {}
                }
              >
                {props.data.map((k, i) => {
                  return (
                    <Accordion
                      key={`mid-header-${i}`}
                      sx={{
                        width: "100%",
                        backgroundColor: "transparent",
                        boxShadow: "none",
                        color: "white",
                      }}
                      expanded={expanded === `panel${i}`}
                      onChange={handleChange(`panel${i}`)}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon style={{ color: "white" }} />}
                        aria-controls={`panel${i}bh-content`}
                        id={`panel${i}bh-header`}
                      >
                        <Typography sx={{ flex: 1 }}>{k.title}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {k.children
                          .sort((a, b) => a.title < b.title)
                          .map((ck, ci) => (
                            <NavLink
                              key={`mid-header-${i}-${ci}`}
                              style={{ textDecoration: "none" }}
                              exact="true"
                              to={{
                                pathname: (() => {
                                  const parentNormalized = k.title.toLowerCase().replace(/[\s-]/g, '');
                                  const childPath = removeHTML(ck);
                                  const currentBasePath = getNavigationBasePath();
                                  
                                  // Handle Image Bank navigation based on current section
                                  if (parentNormalized === 'imagebank') {
                                    // Academic section uses /views/academic/imagebank/[category]
                                    if (currentBasePath === 'academic') {
                                      return `/views/academic/imagebank/${childPath}`;
                                    }
                                    // Other sections (print-rich, sections) use /views/sections/image-bank/[category]
                                    return `/views/sections/image-bank/${childPath}`;
                                  }
                                  
                                  const academicOnlyTabs = ['class', 'grade'];
                                      const effectiveBasePath = academicOnlyTabs.includes(parentNormalized) ? 'academic' : currentBasePath;
                                      const basePath = `/views/${effectiveBasePath}/${k.title.toLowerCase().replace(' ', '-')}`;
                                  const childNormalized = childPath.toLowerCase().replace(/[\s-]/g, '');
                                  if (parentNormalized === childNormalized) {
                                    return basePath;
                                  }
                                  return `${basePath}/${childPath}`;
                                })(),
                                search: `?main=${i}&mu=${ci}`,
                              }}
                            >
                              <MenuItem
                                style={{ paddingLeft: 25, paddingRight: 25 }}
                                onClick={() => handleItemsClick(i, ci, ck.title)}
                              >
                                {ck.title}
                              </MenuItem>
                            </NavLink>
                          ))}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </ul>
            )}
          </nav>
        </>
      }
      <div className={isMobile ? "mobGutter" : "homeGutter"} />
    </div>
  );
};
export default Navbar;
