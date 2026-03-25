import React, { useState, useEffect } from 'react';
import FormatFilter from '../../../uicomponent/filter/FormatFilter'
import ImageRenderer from '../../auth/views/imageRenderer/ImageRenderer'
import { isMobile } from 'react-device-detect';
import { useDispatch, useSelector } from 'react-redux';
import { loadImages } from '../../../redux/apiSlice'
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import SelectImage from "../academics/selectImage";
import { SearchImages } from "../../../redux/fetchSearchSlice";
import { Modal, Chip, Box, Typography } from '@mui/material';
import { Login } from '../../auth/login/Login';
import { SignUp } from '../../auth/signUp/SignUp';
import '../../../uicomponent/filter/AcademicFilter.css'
import '../academics/Academics.css'

const Sections = () => {
    const [open, setOpen] = useState(false)
    const [searchData, setSearchData] = useState({})
    const [filters, setFilters] = useState([])
    const [noSelectImage, setNoSelectImage] = useState([]);
    const [tab, setTab] = useState(0)
    const [selectedFilter, setSelectedFilter] = useState('ALL')
    const { searchedImages, loading: searchLoading } = useSelector(state => state.searchedImage)
    const { list, continuationToken, loading, filters: apiFilters, filterField } = useSelector(state => state.api)
    // State for File format filters 
    const [formats, setFormat] = useState(null)        // formats of files like png , jpg, gif, pdf etc
    const [docType, setDocType] = useState(null)      // state for type of file document like Images, Videos, Animations, etc
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const [currentFilterPath, setCurrentFilterPath] = useState(''); // Track the current filter path
    const [filterBreadcrumb, setFilterBreadcrumb] = useState([]); // Track filter navigation history
    
    // Map URL paths to One Click Resource Center paths
    const getOnClickPath = () => {
        const menuItem = params.navbarMenuItem?.toLowerCase();
        const subMenuItem = params.navbarMenuSubItem;
        const pathMap = {
            'comics': 'one_click_resource_centre/comics',
            'rhymes': 'one_click_resource_centre/rhymes',
            'visual-worksheets': 'one_click_resource_centre/visual worksheets',
            'safety': 'one_click_resource_centre/safety',
            'value-education': 'one_click_resource_centre/value education',
            'art-lessons': 'one_click_resource_centre/art lessons',
            'craft-lessons': 'one_click_resource_centre/craft lessons',
            'computer-lessons': 'one_click_resource_centre/computer lessons',
            'picture-stories': 'one_click_resource_centre/pictorial stories',
            'pictorial-stories': 'one_click_resource_centre/pictorial stories',
            'moral-stories': 'one_click_resource_centre/moral stories',
            'flash-cards': 'one_click_resource_centre/flash cards',
            'gk-science': 'one_click_resource_centre/gk & science',
            'learn-hand-writing': 'one_click_resource_centre/learn hand writing',
            'project-charts': 'one_click_resource_centre/project charts',
            'puzzles-riddles': 'one_click_resource_centre/puzzels & riddles',
            'image-bank': 'ACADEMIC/IMAGE BANK',
            'imagebank': 'ACADEMIC/IMAGE BANK',
            'smart-wall': 'one_click_resource_centre/smart wall',
            'dictionary': 'one_click_resource_centre/dictionary'
        };
        let basePath = pathMap[menuItem] || location.state?.path || 'one_click_resource_centre/comics';
        
        // If there's a sub-menu item (e.g., ANIMALS under image-bank), append it
        // Convert URL-friendly format back to original (dashes to spaces, uppercase)
        if (subMenuItem) {
            let formattedSubMenuItem = decodeURIComponent(subMenuItem).replace(/-/g, ' ').toUpperCase();
            
            // Special mappings for categories with different names in URL vs R2
            const categoryMappings = {
                'AREAS OR LOCALITIES': 'AREAS OR LOCATIES',
                'HOUSEHOLD THINGS': 'HOUSE HOLD THINGS',
                'HOUSEHOLDTHINGS': 'HOUSE HOLD THINGS'
            };
            
            formattedSubMenuItem = categoryMappings[formattedSubMenuItem] || formattedSubMenuItem;
            basePath = `${basePath}/${formattedSubMenuItem}`;
        }
        
        return basePath;
    };
    
    // Get base path for menu item (including category from URL)
    const getBasePath = () => {
        const menuItem = params.navbarMenuItem?.toLowerCase();
        const subMenuItem = params.navbarMenuSubItem?.toLowerCase();
        
        // For Image Bank, include the category from URL
        if (menuItem === 'image-bank' || menuItem === 'imagebank') {
            if (subMenuItem) {
                // Convert URL segment to category name (e.g., 'animals' -> 'ANIMALS')
                const category = subMenuItem.replace(/-/g, ' ').toUpperCase();
                return `ACADEMIC/IMAGE BANK/${category}`;
            }
            return 'ACADEMIC/IMAGE BANK';
        }
        
        // Issue 11: Complete path mapping for all One Click Resource Center sections
        const pathMap = {
            'comics': 'one_click_resource_centre/comics',
            'rhymes': 'one_click_resource_centre/rhymes',
            'visual-worksheets': 'one_click_resource_centre/visual worksheets',
            'visual worksheets': 'one_click_resource_centre/visual worksheets',
            'moral-stories': 'one_click_resource_centre/moral stories',
            'moral stories': 'one_click_resource_centre/moral stories',
            'flash-cards': 'one_click_resource_centre/flash cards',
            'flash cards': 'one_click_resource_centre/flash cards',
            'gk-science': 'one_click_resource_centre/gk & science',
            'gk & science': 'one_click_resource_centre/gk & science',
            'learn-hand-writing': 'one_click_resource_centre/learn hand writing',
            'learn hand writing': 'one_click_resource_centre/learn hand writing',
            'project-charts': 'one_click_resource_centre/project charts',
            'project charts': 'one_click_resource_centre/project charts',
            'puzzles-riddles': 'one_click_resource_centre/puzzels & riddles',
            'puzzles & riddles': 'one_click_resource_centre/puzzels & riddles',
            'smart-wall': 'one_click_resource_centre/smart wall',
            'smart wall': 'one_click_resource_centre/smart wall',
            'dictionary': 'one_click_resource_centre/dictionary'
        };
        
        let basePath = pathMap[menuItem] || getOnClickPath().split('/').slice(0, 2).join('/');
        
        // If there's a sub-menu item, append it
        if (subMenuItem && pathMap[menuItem]) {
            const formattedSubMenuItem = subMenuItem.replace(/-/g, ' ').toUpperCase();
            basePath = `${basePath}/${formattedSubMenuItem}`;
        }
        
        return basePath;
    };
    
    // Function to handle loading of images - moved before handleFilterClick to avoid hoisting issues
    const handleFetchImages = (folderPath) => {
        if (location?.search.includes('?text=') && location?.search.replace('?text=', "").toLowerCase() !== "") {
            let header = {
                "Content-Type": "application/json",
            }
            dispatch(SearchImages({
                headers: header,
                method: "GET",
                body: {
                    query: decodeURIComponent(location?.search.replace('?text=', "").toLowerCase()),
                    size: 100
                }
            }));
            return
        }
        // Use the mapped path for One Click Resource Center
        let path = folderPath ? folderPath : getOnClickPath();
        let header = {
            "Content-Type": "application/json"
        }
        dispatch(loadImages({
            url: "/rest/images/fetch",
            header: header,
            method: "post",
            body: { folderPath: path, imagesPerPage: 500 }
        }));
    }
    
    // Handle filter selection - progressive filtering
    const handleFilterClick = (filter) => {
        const basePath = getBasePath();
        
        if (filter === 'ALL') {
            // Reset to base path - show all items
            setCurrentFilterPath('');
            setFilterBreadcrumb([]);
            setSelectedFilter('ALL');
            handleFetchImages(basePath);
        } else {
            // For Image Bank, we only have ONE level of sub-categories
            // So clicking a filter should REPLACE the current selection, not append
            const newPath = `${basePath}/${filter}`;
            
            // Replace breadcrumb with single item (not append)
            setFilterBreadcrumb([filter]);
            setCurrentFilterPath(newPath);
            setSelectedFilter(filter);
            handleFetchImages(newPath);
        }
    };
    
    // Handle breadcrumb click - go back to specific level
    const handleBreadcrumbClick = (index) => {
        const basePath = getBasePath();
        
        if (index === -1) {
            // Click on "ALL" - reset everything
            setCurrentFilterPath('');
            setFilterBreadcrumb([]);
            setSelectedFilter('ALL');
            handleFetchImages(basePath);
        } else {
            // Go back to specific level
            const newBreadcrumb = filterBreadcrumb.slice(0, index + 1);
            const newPath = `${basePath}/${newBreadcrumb.join('/')}`;
            setFilterBreadcrumb(newBreadcrumb);
            setCurrentFilterPath(newPath);
            setSelectedFilter(newBreadcrumb[newBreadcrumb.length - 1]);
            handleFetchImages(newPath);
        }
    };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => handleFetchImages(), [params.navbarMenuItem, params.navbarMenuSubItem, location?.search])
    
    // Transform searchedImages array to object format when it changes
    useEffect(() => {
        if (Array.isArray(searchedImages) && searchedImages.length > 0) {
            const transformedData = {};
            searchedImages.forEach((item) => {
                // Use path (full URL) as key and value
                const key = item.path || item.s3_path || item.title || '';
                if (key) {
                    transformedData[key] = item.path || item.thumbnail_url || item.thumbnail || '';
                }
            });
            setSearchData(transformedData);
        } else {
            setSearchData({});
        }
    }, [searchedImages]);
    
    const selectPicture = (data, remove) => {
        if (remove) {
            setNoSelectImage((current) => {
                const copy = [...current];
                let index = copy.indexOf(data);
                if (index > -1) {
                    copy.splice(index, 1);
                }
                return copy;
            });
        } else {
            setNoSelectImage((current) => {
                const copy = [...current];
                copy.push(data);
                return copy;
            });
        }
    };
    const handleAddToFavourite = (data) => {
        setNoSelectImage((current) => {
            const copy = [...current];
            let index = copy.indexOf(data);
            if (index > -1) {
                copy[index].markFav = !copy[index]?.markFav;
            }
            return copy;
        });
    };
    const handleRemoveAll = () => {
        setNoSelectImage([]);
    };
    const handleClose = () => {
        setOpen(false);
        setTab(0);
    };
    
    // Reset selected filter when menu changes
    useEffect(() => {
        setSelectedFilter('ALL');
        setCurrentFilterPath('');
        setFilterBreadcrumb([]);
    }, [params.navbarMenuItem]);
    
    // Check if we're on Image Bank page - mega menu handles filtering, no extra filter needed
    const isImageBankPage = () => {
        const menuItem = params.navbarMenuItem?.toLowerCase();
        return menuItem === 'image-bank' || menuItem === 'imagebank';
    };
    
    return (
        <>
            <div className="checkboxContainer">
                <SelectImage
                    image={noSelectImage}
                    handleRemove={selectPicture}
                    handleRemoveAll={handleRemoveAll}
                    handleAddToFavourite={handleAddToFavourite}
                />
            </div>
            <div>
                {/* Image Bank: Uses MegaMenu dropdown (rendered by Header.jsx) - no separate filter bar needed
                    Non-Image Bank sections: Show filter bar if filters available from API */}
                {!isImageBankPage() && apiFilters && apiFilters.length > 0 && (
                    <div className="academicFilterContainer">
                        <div className="academicBluePane">
                            <div className="bookTypesRow">
                                {/* ALL option */}
                                <div
                                    className={`bookTypeChip ${selectedFilter === 'ALL' ? 'active' : ''}`}
                                    onClick={() => handleFilterClick('ALL')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    ALL
                                </div>
                                {apiFilters.map((filter) => (
                                    <div
                                        key={filter}
                                        className={`bookTypeChip ${selectedFilter === filter ? 'active' : ''}`}
                                        onClick={() => handleFilterClick(filter)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {filter}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                
                <div className='academicsContainer'>
                    <div className={isMobile ? 'mobGutter' : 'homeGutter'} />
                    <div className='academicsWrapper'>
                        <FormatFilter
                            formats={formats}
                            setFormat={setFormat}
                            docType={docType}
                            setDocType={setDocType}
                        />
                        <ImageRenderer
                            openLogin={setOpen}
                            loading={location?.search.includes('?text=') ? searchLoading : loading}
                            pageType={location?.search.includes('?text=') ? 'result' : 'sections'}
                            data={location?.search.includes('?text=') ? searchData : list}
                            token={continuationToken}
                            addedImages={noSelectImage}
                            addToNoSelectImage={selectPicture}
                            selectedFilters={formats}
                        />
                    </div>
                    <div className={isMobile ? 'mobGutter' : 'homeGutter'} />
                </div>
            </div>
            <Modal className='openModal' onClose={handleClose} open={open}>
                {tab === 0 ? (
                    <Login changeTab={() => setTab(tab === 0 ? 1 : 0)} handleCloseModal={handleClose}/>
                ) : (
                    <SignUp changeTab={() => setTab(tab === 0 ? 1 : 0)} handleCloseModal={handleClose}/>
                )}
            </Modal>
        </>
    )
}
export default Sections;