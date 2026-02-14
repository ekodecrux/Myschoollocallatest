import { Link, Typography } from '@mui/material'
import React from 'react'
import "./ItemsContainer.css"
import { useDispatch, useSelector } from "react-redux";
import { loadImages } from '../../../../redux/apiSlice';
import { isMobile } from 'react-device-detect';
import { useLocation, useNavigate } from 'react-router-dom';

const ItemsContainer = (props) => {
    const dispatch = useDispatch()
    const location = useLocation()
    const navigate = useNavigate()
    
    const buildFolderPath = (child) => {
        const pathname = location.pathname.toLowerCase();
        const isImageBank = pathname.includes('imagebank') || pathname.includes('image-bank');
        
        if (isImageBank) {
            const category = props.categoryTitle?.toUpperCase() || '';
            const subCategory = props.parent?.toUpperCase() || '';
            
            if (child && typeof child === 'string' && child !== 'All') {
                return `ACADEMIC/IMAGE BANK/${category}/${subCategory}/${child}`;
            }
            return `ACADEMIC/IMAGE BANK/${category}/${subCategory}`;
        }
        
        let path = props.getPrevPath()
        typeof (child) !== "object" ? path = path + `/${props.parent}/${child}/` : path = path + `/${props.parent}/`
        path = path.split('/').filter((ele) => ele)
        path.splice(1, 0, 'thumbnails')
        path = path.join('/')
        return path.replace('All/', '');
    }
    
    const handleFetchData = (child) => {
        const path = buildFolderPath(child);
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
    
    const handleNavigation = (child) => {
        const pathname = location.pathname.toLowerCase();
        const isOneClickResource = pathname.includes('sections');
        const isMakers = pathname.includes('makers') || child?.toLowerCase()?.includes('maker');
        
        if (isMakers) {
            const makerPath = `/views/${getMainSection()}/makers`;
            navigate(makerPath);
            return;
        }
        
        if (isOneClickResource || props.heading) {
            const mainSection = getMainSection();
            const subSection = props.heading?.toLowerCase().replace(/\s+/g, '-') || '';
            const childSection = child?.toLowerCase().replace(/\s+/g, '-') || '';
            
            let targetPath = `/views/sections/${subSection}`;
            if (childSection && childSection !== 'all') {
                targetPath = `/views/sections/${subSection}/${childSection}`;
            }
            
            navigate(targetPath);
        }
        
        handleFetchData(child);
    }
    
    const getMainSection = () => {
        const pathname = location.pathname.toLowerCase();
        if (pathname.includes('academic')) return 'academic';
        if (pathname.includes('early-career')) return 'early-career';
        if (pathname.includes('edutainment')) return 'edutainment';
        if (pathname.includes('print-rich')) return 'print-rich';
        if (pathname.includes('info-hub')) return 'info-hub';
        if (pathname.includes('maker')) return 'maker';
        return 'academic';
    }
    
    return (
        <div className="mmItemContainer" onClick={isMobile ? () => props?.mobileDrawer(false) : undefined}>
            <div onClick={() => handleNavigation(null)} style={{ minHeight: 33, cursor: 'pointer' }}>
                <Typography
                    fontSize={isMobile ? 18 : 22}
                    className={'cursorPointer itemsHeading'}
                    color={isMobile ? '#B0CEFE' : 'inherit'}
                    fontFamily={"Roboto"}
                    textTransform={'capitalize'}
                    fontWeight={300}>{props.heading === null ? " " : props.heading.toLowerCase()}</Typography>
            </div>
            <div className='mmItemContainerList'>
                {props?.data?.map((ck, ci) => {
                    if (ck.type !== "file") return (
                        <div key={ck?.title} className={ck.children?.length >= 2 ? 'yellowBackground' : 'mmItemContainerOrderList'} onClick={() => handleNavigation(ck?.title.toUpperCase())} style={{ cursor: 'pointer' }}>
                            <Typography className='mmItemContainerLink cursorPointer'>{ck?.title.toLowerCase()}</Typography>
                        </div>
                    )
                }
                )}
            </div>
        </div>
    )
}
export default ItemsContainer
