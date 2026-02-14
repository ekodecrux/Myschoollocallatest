import React from 'react';
import { Typography, IconButton } from "@mui/material";
import { AcademicHubIcons, AcademicHubResource } from "./Icons";
import { isMobile } from "react-device-detect";
import { useNavigate } from 'react-router';
const HomeCategory = () => {
    const navigate = useNavigate()
    return (
        <div className="homeCategoryContainer">
            <div className='clickResource'>
                <Typography textAlign={'center'} fontSize={'5.25vw'}
                    className="homeTextStroke"
                    style={{ userSelect: 'none' }}
                    fontFamily="'Futura Md BT', sans-serif;" color='#D61111'>ONE
                    CLICK RESOURCE CENTRE</Typography>
                <div className="homeCategoryWrapper">
                    {AcademicHubIcons.map((k, i) => (
                        <IconButton className='academicHubIcons'
                            key={i}
                            onClick={() => {
                                if (k.path) {
                                    // For Image Bank, uri already contains the full path
                                    const targetPath = k.uri.includes('image-bank') 
                                        ? k.uri 
                                        : `${k.uri}/${k.name.toLocaleLowerCase().replace(" ", "")}`;
                                    navigate(targetPath, { state: { path: k.path } });
                                }
                            }}
                            sx={{
                                "&:hover": {
                                    backgroundImage: `url(${k.hover})`,
                                    width: isMobile ? '34vw' : '8.85vw',
                                    height: `calc(1.207*${isMobile ? '34vw' : '8.85vw'})`,
                                    backgroundSize: "cover",
                                    backgroundRepeat: "no-repeat",
                                },
                                backgroundImage: `url(${k.icon})`,
                                borderRadius: "unset",
                                width: isMobile ? '30vw' : '7.81vw',
                                height: `calc(1.207*${isMobile ? '30vw' : '7.81vw'})`,
                                transition: "width 0.2s ease-in-out, height 0.2s ease-in-out",
                                backgroundSize: "cover",
                                backgroundRepeat: "no-repeat",
                            }}
                            disableFocusRipple
                            disableRipple
                        />
                    ))}
                    {isMobile ? null :
                        <>
                            <div style={{ width: '5px' }}>
                            </div>
                            <div style={{ width: '55px' }}>
                            </div>
                            <div style={{ width: '25px' }}>
                            </div>
                        </>
                    }
                </div>
            </div>
            <div className='classWise'>
                <Typography textAlign={'center'} fontSize={'4.70vw'} fontWeight={600}
                    className="homeTextStroke"
                    style={{ userSelect: 'none' }}
                    fontFamily="'Futura Md BT', sans-serif;" color='#339966'>CLASS WISE ACADEMIC RESOURCE</Typography>
                <div className="homeCategoryWrapper">
                    {AcademicHubResource.map((k, i) => (
                        <IconButton
                            key={i}
                            onClick={() => {
                                if (k.path)
                                    navigate("/views/academic", { state: { path: k.path } });
                            }}
                            sx={{
                                "&:hover": {
                                    backgroundImage: `url(${k.hover})`,
                                    width: isMobile ? '34vw' : '8.85vw',
                                    height: `calc(1.207*${isMobile ? '34vw' : '8.85vw'})`,
                                    backgroundSize: "cover",
                                    backgroundRepeat: "no-repeat",
                                },
                                backgroundImage: `url(${k.icon})`,
                                borderRadius: "unset",
                                width: isMobile ? '30vw' : '7.81vw',
                                height: `calc(1.207*${isMobile ? '30vw' : '7.81vw'})`,
                                transition: "width 0.2s ease-in-out, height 0.2s ease-in-out",
                                backgroundSize: "cover",
                                backgroundRepeat: "no-repeat",
                            }}
                            disableFocusRipple
                            disableRipple
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
export default HomeCategory;