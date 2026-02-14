import { Typography } from '@mui/material';
import React from 'react';
import './Footer.css';
import ReactCountryFlag from "react-country-flag"
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';
const Footer = () => {
   return (
      <>
         <footer style={{ display: 'flex', flex: '0.1', flexDirection: isMobile ? "column" : 'row', gap: '30px' }}>
            <div className="homeGutter"></div>
            <div style={{ display: 'flex', flex: '0.1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
               <ReactCountryFlag
                  countryCode="in"
                  svg
                  cdnUrl="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.4.3/flags/1x1/"
                  cdnSuffix="svg"
                  title="in" />
               {/* <section><ReactCountryFlag countryCode="India" /></section> */}
            </div>
            <div className='footertextContainer' >
               <Link to={'/views/privacy'} ><Typography>Privacy</Typography></Link>
               <Link to={'/views/terms'} ><Typography>Terms</Typography></Link>
               <Link to={'/views/cookies'} ><Typography>Cookies</Typography></Link>
               <Link to={'/views/help'} ><Typography>Help</Typography></Link>
            </div>
            <div className="homeGutter"></div>
         </footer>
      </>
   )
}
export default Footer;