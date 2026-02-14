import * as React from 'react';
import { Box, Typography, Link, Menu, MenuItem, Fade, IconButton } from '@mui/material';
import { isMobile } from 'react-device-detect';
import { ReactComponent as MySchool } from "../../../assests/homeScreen/myschool-white-logo.svg";
import { ReactComponent as Crossicon } from '../../../assests/homeScreen/crossicon.svg';
import { navData } from '../../homeScreen/Constants.jsx';
import { Button, Card } from '@mui/material'
import "./MobileMenu.css"
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Navbar from '../Navbar/Navbar';
import { menuItemsAcademics } from "../menuItemsAcademics";
import { menuItemsEarlyCarrer } from "../menuItemsEarlyCarrer";
import { menuItemsEdutainment } from "../menuItemsEdutainment";
import { menuItemsInfoHub } from "../menuItemsInfoHub";
import { menuItemsPrintRich } from "../menuItemsPrintRich";
import { NavLink, useLocation } from 'react-router-dom';
import MegaMenu from '../MegaMenu/Index';
import Menubar from '../Menubar/Menubar';
import { menuItemsMakers } from '../menuItemsMakers';
function LinkTab(props) {
  return (
    <Tab
      component="a"
      // onClick={(event) => {
      //   event.preventDefault();
      // }}
      {...props}
    />
  );
}
export default function MobileMenu(props) {
  const [value, setValue] = React.useState(0);
  const location = useLocation();
  var path = location.pathname.split('/').filter(el => el).filter(el => el !== "views")[0]
  path = value === 0 ? 'academic' : 'early-career'
  const [pathN, setPathN] = React.useState(path);
  let menuItems = []
  menuItems = menuItemsAcademics.slice()
  let menuItemEarlyCarrer = []
  menuItemEarlyCarrer = menuItemsEarlyCarrer.slice()
  let menuItemEdutainment = []
  menuItemEdutainment = menuItemsEdutainment.slice()
  let menuItemInfoHub = []
  menuItemInfoHub = menuItemsInfoHub.slice()
  let menuItemPrintRich = []
  menuItemPrintRich = menuItemsPrintRich.slice()
  let menuItemMakers = []
  menuItemMakers = menuItemsMakers.slice()
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  var tabPath = pathN.split('/').filter(ele => ele)[1];
  const tabRender = () => {
    return (
      <Tabs
        // value={tabPath === "academic" ? 0 : "early-career" ? 1: "edutainment" ? 2 : "print-rich" ? 3 : "maker" ? 4 : 5}
        value={value}
        indicatorColor="secondary"
        TabIndicatorProps={{
          style: {
            height: 4
          }
        }}
        className="tabsContainer" onChange={handleChange} aria-label="Tabs">
        {navData.map((key, index) => {
          return (
            <LinkTab
              href={`/views/${key.name.toLocaleLowerCase().replace(" ", "")}`}
              key={`nav-${index}`}
              className="homeNavigationLink"
              id={`simple-tab-${index}`}
              aria-controls={`simple-tabpanel-${index}`}
              icon={key.mobileImage}
              label={<Typography style={{ color: 'white', fontSize: '12px', paddingBottom: 15 }}>{key.name}</Typography>}
              sx={{ opacity: 1, padding: 0, minWidth: "60px" }}
              onClick={(e) => {
                setPathN(`/views/${key.name.toLocaleLowerCase().replace(" ", "")}`);
                e.preventDefault();
                // path
              }}
            >
            </LinkTab>
          );
        })}
      </Tabs>
    );
  };
  const getCurrentPath = () => {
    let newPath = pathN.split('/').filter(ele => ele)[1]
    let pathName = location.pathname.split("/");
    let newPathName = location.pathname.split('/');
    let newP = newPathName.splice(2, 1, 'academic');
    return newPathName
    // return pathName
  }
  const tabPanelRender = () => {
    return (
      <>
        {props.selectedNavBar !== null && props.selectedOverlayMenu !== null ?
          <div className='mobileMenuPathContainer'>
            {
            value === 0 && location.pathname === '/views/academic/makers/chart-maker' ?
              <Typography variant='caption' color='#B0CEFE'>
                MAKERS / CHART MAKER
              </Typography> :
              value === 0 ?
              <Typography variant='caption' color='#B0CEFE'>
                {menuItems[props.selectedNavBar].title} / {menuItems[props.selectedNavBar].children[props.selectedOverlayMenu].title}
              </Typography> :
              value === 1 ?
                <Typography variant='caption' color={'#B0CEFE'}>
                  {menuItemEarlyCarrer[props.selectedNavBar].title} / {menuItemEarlyCarrer[props.selectedNavBar].children[props.selectedOverlayMenu].title}
                </Typography> :
                value === 2 ?
                  <Typography variant='caption' color={'#B0CEFE'}>
                    {menuItemEdutainment[props.selectedNavBar].title} / {menuItemEdutainment[props.selectedNavBar].children[props.selectedOverlayMenu].title}
                  </Typography> :
                  value === 3 ?
                    <Typography variant='caption' color={'#B0CEFE'}>
                      {menuItemPrintRich[props.selectedNavBar].title} / {menuItemPrintRich[props.selectedNavBar].children[props.selectedOverlayMenu].title}
                    </Typography> :
                    value === 4 ?
                      <Typography variant='caption' color={'#B0CEFE'}>
                        {menuItemMakers[props.selectedNavBar]?.title} / {menuItemMakers[props.selectedNavBar].children[props.selectedOverlayMenu].title}
                      </Typography> :
                      value === 5 ?
                        <Typography variant='caption' color={'#B0CEFE'}>
                          {menuItemInfoHub[props.selectedNavBar].title} / {menuItemInfoHub[props.selectedNavBar].children[props.selectedOverlayMenu].title}
                        </Typography> :
                        null}
            <NavLink onClick={props.clearParams}
              to={{ pathname: `/views/${getCurrentPath()[2]}` }}>
              <Typography color='#FFFFFF' fontFamily='Nunito Sans !important'>Back</Typography>
            </NavLink>
          </div> :
          <Navbar
            data={value === 0 ? menuItems :
              value === 1 ? menuItemEarlyCarrer :
                value === 2 ? menuItemEdutainment :
                  value === 3 ? menuItemPrintRich :
                    value === 4 ? menuItemMakers :
                      value === 5 ? menuItemInfoHub : null}
            overlay={true} />
        }
      </>
    )
  }
  return (
    <div className='mobileMenuContainer' >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {isMobile ? <div className="mobileMenuLogo">
          <div className="mobileMySchoolLogo">
            <MySchool width='177px' height='40px' />
          </div>
          <div className='crossIcon' onClick={() => props.mobileDrawer(false)}>
            <Crossicon color="#FFFFFF" />
          </div>
        </div> : null}
        <Card className='mobileViewLanguageContainer'>
          <section className='languageContainer'>
            <Typography className="languageIcon" fontSize="16px">L</Typography>
            <Typography fontSize="15px" style={{ paddingLeft: '10px', color: 'white' }}>Language: English</Typography>
          </section>
          <section className='buttonContainer'>
            <Button variant="text">CHANGE</Button>
          </section>
        </Card>
        {/* {navRender()} */}
        <Box sx={{ padding: "3%", borderBottom: 1, borderColor: '#727272' }}>
          <Box>
            {tabRender()}
          </Box>
        </Box>
        {tabPanelRender()}
        <div className='mobileMenuMainContainer' style={{ display: 'flex', flex: 1 }}>
          {props.selectedNavBar !== 3 ?
            <Menubar active={props.selectedNavBar}
              data={props.menubarData}
              handleSelectedMenuItem={props.setSelectedMegaMenuItem} selected={props.selectedMegaMenuItem} /> : null}
          {props.selectedNavBar !== null && props.selectedOverlayMenu !== null && props.selectedNavBar !== 3 ?
            <div className='mobileMegaMenuContainer' onClick={() => props.mobileDrawer(false)}>
              <MegaMenu
                getPrevPath={props.getPrevPath}
                data={menuItems[props.selectedNavBar]?.children[props.selectedOverlayMenu]?.children ?
                  menuItems[props.selectedNavBar]?.children[props.selectedOverlayMenu]?.children[props.selectedMegaMenuItem] : null} /></div> :
            null}
          {props.selectedNavBar !== null && props.selectedOverlayMenu !== null && props.selectedNavBar !== 3
            && navData.url === "/views/early-carrier" ?
            <div onClick={() => props.mobileDrawer(false)}>
              <MegaMenu style={{ flex: 0.6 }}
                getPrevPath={props.getPrevPath}
                data={menuItemEarlyCarrer[props.selectedNavBar]?.children[props.selectedOverlayMenu]?.children ?
                  menuItemEarlyCarrer[props.selectedNavBar]?.children[props.selectedOverlayMenu]?.children[props.selectedMegaMenuItem] : null} /></div> :
            null}
          {props.selectedNavBar !== null && props.selectedOverlayMenu !== null && props.selectedNavBar !== 3
            && navData.url === "/views/maker" ?
            <div onClick={() => props.mobileDrawer(false)}>
              <MegaMenu style={{ flex: 0.6 }}
                getPrevPath={props.getPrevPath}
                data={menuItemMakers[props.selectedNavBar]?.children[props.selectedOverlayMenu]?.children ?
                  menuItemMakers[props.selectedNavBar]?.children[props.selectedOverlayMenu]?.children[props.selectedMegaMenuItem] : null} /></div> :
            null}
        </div>
      </Box>
    </div>
  );
}
