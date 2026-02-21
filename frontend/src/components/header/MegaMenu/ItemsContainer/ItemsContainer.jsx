import { Link, Typography } from '@mui/material'
import React from 'react'
import "./ItemsContainer.css"
import { useDispatch, useSelector } from "react-redux";
import { loadImages } from '../../../../redux/apiSlice';
import { isMobile } from 'react-device-detect';
import { useLocation, useNavigate } from 'react-router-dom';

// One Click Resource Center sections that should route to /views/sections/
// NOTE: image-bank is NOT included here because it can be accessed from both
// Academic (/views/academic/imagebank) and Sections (/views/sections/image-bank)
const ONE_CLICK_SECTIONS = [
    'comics', 'rhymes', 'visual-worksheets', 'visual worksheets', 'safety', 
    'value-education', 'value education', 'art-lessons', 'art lessons',
    'craft-lessons', 'craft lessons', 'computer-lessons', 'computer lessons',
    'picture-stories', 'pictorial-stories', 'pictorial stories', 'moral-stories', 'moral stories',
    'flash-cards', 'flash cards', 'gk-science', 'gk & science',
    'learn-hand-writing', 'learn hand writing', 'project-charts', 'project charts',
    'puzzles-riddles', 'puzzels & riddles', 'smart-wall', 'smart wall',
    'dictionary'
];

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
    
    // Check if the heading/section belongs to One Click Resource Center
    const isOneClickSection = (heading) => {
        if (!heading) return false;
        const normalized = heading.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
        return ONE_CLICK_SECTIONS.some(section => 
            normalized === section || section === normalized
        );
    }
    
    const handleNavigation = (child) => {
        const pathname = location.pathname.toLowerCase();
        const isCurrentlyInAcademic = pathname.includes('/academic/');
        const isCurrentlyInSections = pathname.includes('/sections/');
        const isImageBank = pathname.includes('imagebank') || pathname.includes('image-bank');
        const isMakers = pathname.includes('makers') || child?.toLowerCase()?.includes('maker');
        
        if (isMakers) {
            const makerPath = `/views/${getMainSection()}/makers`;
            navigate(makerPath);
            return;
        }
        
        // If we're already in Academic path, stay in Academic
        // If we're in Sections path, stay in Sections
        // Only navigate to sections for One Click Resource Center content when NOT already in Academic
        const headingLower = props.heading?.toLowerCase().replace(/_/g, ' ') || '';
        const shouldUseSections = isCurrentlyInSections || (!isCurrentlyInAcademic && isOneClickSection(headingLower));
        
        if (shouldUseSections) {
            const subSection = headingLower.replace(/\s+/g, '-') || '';
            const childSection = child?.toLowerCase().replace(/\s+/g, '-') || '';
            
            let targetPath = `/views/sections/${subSection}`;
            if (childSection && childSection !== 'all') {
                targetPath = `/views/sections/${subSection}/${childSection}`;
            }
            
            navigate(targetPath);
        }
        // If in Academic path and clicking Image Bank items, no URL navigation needed
        // Just fetch the data - the current Academic page will display it
        
        // Always fetch data regardless of navigation
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
