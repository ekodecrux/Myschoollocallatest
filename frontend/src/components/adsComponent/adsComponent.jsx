import { Divider } from "@mui/material";
import React from "react";
import "./adsComponent.css";
import { ReactComponent as AIIcon } from "../../assests/ads/AIIcon.svg";
import Carousel from "react-material-ui-carousel";
import { isMobile } from "react-device-detect";
const AdsComponent = (props) => {
  // const stories =[{url : AdSpace1}, {url : AdSpace1}, {url : AdSpace1}]
  const ref = React.useRef();
  return (
    <div className="adsMainContainer">
      <div className="adsAiWrapper">
        <AIIcon />
      </div>
      <Divider className="adsSectionDivider" />
      <div className="adsImagesContainer">
        <Carousel indicatorContainerProps={{
          style: {
            marginTop: '-5px', 
            textAlign: 'center'
          }
        }}
          className="mySwiper">
          <div ref={ref} className="slide1" />
          <div className="slide2" />
          <div className="slide3" />
          <div className="slide4" />
          <div className="slide5" />
          <div className="slide6" />
          <div className="slide7" />
          <div className="slide8" />
          <div className="slide9" />
          <div className="slide10" />
        </Carousel>
      </div>
      {/* <div className='homeGutter' /> */}
    </div>
  );
};
export default AdsComponent;
