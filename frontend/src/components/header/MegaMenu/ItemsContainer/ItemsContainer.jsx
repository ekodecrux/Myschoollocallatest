import { Link, Typography } from '@mui/material'
import React from 'react'
import "./ItemsContainer.css"
import { useDispatch, useSelector } from "react-redux";
import { loadImages } from '../../../../redux/apiSlice';
import { isMobile } from 'react-device-detect';
import { useLocation } from 'react-router-dom';

const ItemsContainer = (props) => {
    const dispatch = useDispatch()
    const location = useLocation()
    
    // Build the folder path for image fetching
    const buildFolderPath = (child) => {
        // Get the current route to determine context
        const pathname = location.pathname.toLowerCase();
        const isImageBank = pathname.includes('imagebank') || pathname.includes('image-bank');
        
        // For Image Bank, build path using categoryTitle (from overlay menu, e.g., "ANIMALS") 
        // and parent (from megamenu item, e.g., "DOMESTIC ANIMALS")
        if (isImageBank) {
            // props.categoryTitle is the overlay menu selection (e.g., "ANIMALS")
            // props.parent is the subcategory (e.g., "DOMESTIC ANIMALS") 
            // child is the item being clicked (e.g., "Images" folder or null for heading)
            const category = props.categoryTitle?.toUpperCase() || '';
            const subCategory = props.parent?.toUpperCase() || '';
            
            if (child && typeof child === 'string' && child !== 'All') {
                // Clicking on a child item (like "Images" folder)
                return `ACADEMIC/IMAGE BANK/${category}/${subCategory}/${child}`;
            }
            // Clicking on the heading (subcategory name like "Domestic Animals")
            return `ACADEMIC/IMAGE BANK/${category}/${subCategory}`;
        }
        
        // For other sections, use the original path building logic
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
    
    return (
        <div className="mmItemContainer" onClick={isMobile ? () => props?.mobileDrawer(false) : undefined}>
            <div onClick={() => handleFetchData(null)} style={{ minHeight: 33 }}>
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
                        <div key={ck?.title} className={ck.children?.length >= 2 ? 'yellowBackground' : 'mmItemContainerOrderList'} onClick={() => handleFetchData(ck?.title.toUpperCase())}>
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