import React from 'react';
import { Typography } from "@mui/material";
import { isMobile } from "react-device-detect";
import { govImageData } from "./govimageConstant";
import { Link as CustomLink } from '@mui/material'
const GovImageRender = () => {
    const [hoverCard, setHoverCard] = React.useState([])
    return (
        <div className='govImageMainContainer'>
            <Typography className='initiativesForEducators textShadow' textAlign={'center'}
                color="white" style={{ marginTop: (isMobile ? '50px' : 90), marginBottom: (isMobile ? '0px' : 90), userSelect: 'none' }}
                fontSize={'4.85vw'} fontFamily="'Futura Md BT', sans-serif;"
            >
                GOVT. INITIATIVES FOR EDUCATORS</Typography>
            <div className='govImageContainerWrapperTop'>
                <div className="homeGutter" />
                {govImageData[0].map((item, index) => {
                    return (
                        <CustomLink className='customLink' onMouseOver={() => setHoverCard([1, index])} onMouseOut={() => setHoverCard([])}
                            sx={{
                                '&:hover': {
                                    background: 'white',
                                    borderRadius: '8px'
                                }
                            }}
                            key={index}>
                            <div className="homeGovImgWrapper" >
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                    {hoverCard[1] === index && hoverCard[0] === 1 ? item?.hoverImage : item?.image}
                                </div>
                            </div>
                        </CustomLink>
                    );
                })}
                <div className="homeGutter" />
            </div>
            <div className='govImageContainerWrapperBottom'>
                <div className="homeGutter" />
                {govImageData[1].map((item, index) => {
                    return (
                        <CustomLink onMouseOver={() => setHoverCard([2, index])} onMouseOut={() => setHoverCard([])}
                            sx={{
                                '&:hover': {
                                    background: 'white',
                                    borderRadius: '8px'
                                }
                            }}
                            key={index} className='customLink'>
                            <div className="homeGovImgWrapper">
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                    {hoverCard[1] === index && hoverCard[0] === 2 ? item?.hoverImage : item?.image}
                                </div>
                            </div>
                        </CustomLink>
                    );
                })}
                <div className="homeGutter" />
            </div>
        </div>
    );
};
export default GovImageRender;