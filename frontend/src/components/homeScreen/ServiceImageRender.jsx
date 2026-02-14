import React from 'react';
import { Typography } from "@mui/material";
import { BrowserView, MobileView } from "react-device-detect";
import { Link as CustomLink } from '@mui/material'
import { serviceCenterIconsData, mobileserviceCenterIconsData } from "./Constants.jsx";
const ServiceImageRender = () => {
    const [hoverServiceCard, setHoverServiceCard] = React.useState([])
    return (
        <>
            <MobileView>
                <div className="serviceImageContainerMainContainer" >
                    <Typography textAlign={'center'} color="white"
                        style={{ userSelect: 'none' }}
                        className="textShadow"
                        paddingTop={'25px'}
                        marginBottom={'22px'}
                        fontSize={'4.85vw'} fontFamily="'Futura Md BT', sans-serif;"
                    >
                        SCHOOL'S SERVICE CENTRE</Typography>
                    <div className='serviceImageContainerWrapper'>
                        {mobileserviceCenterIconsData.map((item, index) =>
                            <CustomLink href={item.url} className='Link' onMouseOver={() => setHoverServiceCard([1, index])} onMouseOut={() => setHoverServiceCard([])}
                                key={index} > {hoverServiceCard[1] === index && hoverServiceCard[0] === 1 ? item?.hoverImage : item?.image}
                            </CustomLink>
                        )}
                    </div>
                </div>
            </MobileView>
            <BrowserView>
                <div className="serviceImageContainerMainContainer" >
                    <Typography textAlign={'center'} color="white" className="textShadow"
                        style={{ paddingTop: 50, marginBottom: 30, userSelect: 'none' }} fontSize={'4.85vw'} fontFamily="'Futura Md BT', sans-serif;">
                        SCHOOL'S SERVICE CENTRE</Typography>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6.25vw', paddingBottom: "6.25vw" }}>
                        <div className='serviceImageContainerWrapper'>
                            {serviceCenterIconsData[0].map((item, index) =>
                                <CustomLink href={item.url} onMouseOver={() => setHoverServiceCard([1, index])} onMouseOut={() => setHoverServiceCard([])}
                                    key={index} style={{ display: 'flex' }}> {hoverServiceCard[1] === index && hoverServiceCard[0] === 1 ? item?.hoverImage : item?.image}
                                </CustomLink>
                            )}
                        </div>
                        <div className='serviceImageContainerWrapper'>
                            {serviceCenterIconsData[1].map((item, index) => <CustomLink href={item.url} onMouseOver={() => setHoverServiceCard([2, index])} onMouseOut={() => setHoverServiceCard([])}
                                key={index} style={{ display: 'flex' }}> {hoverServiceCard[1] === index && hoverServiceCard[0] === 2 ? item?.hoverImage : item?.image}
                            </CustomLink>
                            )}
                        </div>
                    </div>
                </div>
            </BrowserView>
        </>
    )
}
export default ServiceImageRender;