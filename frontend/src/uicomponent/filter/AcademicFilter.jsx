import React, { useState, useEffect, useCallback } from 'react';
import { ScrollMenu, VisibilityContext } from "react-horizontal-scrolling-menu";
import { LeftArrow, RightArrow } from './Arrow';
import useDrag from '../../customTheme/signUpMenu/useDrag';
import "../../customTheme/signUpMenu/hideScrollBar.css";
import { useLocation } from "react-router-dom";
import './AcademicFilter.css';

const AcademicFilter = ({ loadImages }) => {
    const location = useLocation();
    const [subjects, setSubjects] = useState([]);
    const [bookTypes, setBookTypes] = useState([]);
    const [unitLessons, setUnitLessons] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedBookType, setSelectedBookType] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const { dragStart, dragStop, dragMove, dragging } = useDrag();
    const handleDrag = ({ scrollContainer }) => (e) => dragMove(e, (posDiff) => {
        if (scrollContainer.current) {
            scrollContainer.current.scrollLeft += posDiff;
        }
    });
    
    // Get current class from URL
    const getCurrentClass = useCallback(() => {
        const pathname = location.pathname.toLowerCase();
        const parts = pathname.split('/').filter(p => p);
        
        if (parts.includes('academic') && parts.includes('class')) {
            const classIndex = parts.indexOf('class');
            if (classIndex !== -1 && parts[classIndex + 1]) {
                return parts[classIndex + 1].toUpperCase();
            }
        }
        return null;
    }, [location.pathname]);
    
    // Fetch subjects when class changes
    useEffect(() => {
        const fetchSubjects = async () => {
            const currentClass = getCurrentClass();
            if (!currentClass) {
                setSubjects([]);
                return;
            }
            
            setLoading(true);
            try {
                const backendUrl = process.env.REACT_APP_BACKEND_URL;
                const response = await fetch(`${backendUrl}/api/rest/academic/subjects`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ class_level: currentClass })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setSubjects(data.subjects || []);
                    // Load all images for this class initially
                    loadImages(`academic/class/${currentClass.toLowerCase()}`);
                }
            } catch (error) {
                console.error('Error fetching subjects:', error);
            }
            setLoading(false);
        };
        
        fetchSubjects();
        // Reset selections when class changes
        setSelectedSubject(null);
        setSelectedBookType(null);
        setSelectedLesson(null);
        setBookTypes([]);
        setUnitLessons([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);
    
    // Fetch book types when subject is selected
    useEffect(() => {
        const fetchBookTypes = async () => {
            const currentClass = getCurrentClass();
            if (!currentClass || !selectedSubject) {
                setBookTypes([]);
                setUnitLessons([]);
                return;
            }
            
            setLoading(true);
            try {
                const backendUrl = process.env.REACT_APP_BACKEND_URL;
                const response = await fetch(`${backendUrl}/api/rest/academic/book-types`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        class_level: currentClass,
                        subject: selectedSubject
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setBookTypes(data.book_types || []);
                    // Auto-select first book type
                    if (data.book_types && data.book_types.length > 0) {
                        setSelectedBookType(data.book_types[0]);
                    }
                }
            } catch (error) {
                console.error('Error fetching book types:', error);
            }
            setLoading(false);
        };
        
        if (selectedSubject) {
            fetchBookTypes();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubject, location.pathname]);
    
    // Fetch unit lessons when book type is selected
    useEffect(() => {
        const fetchUnitLessons = async () => {
            const currentClass = getCurrentClass();
            if (!currentClass || !selectedSubject || !selectedBookType) {
                setUnitLessons([]);
                return;
            }
            
            setLoading(true);
            try {
                const backendUrl = process.env.REACT_APP_BACKEND_URL;
                const response = await fetch(`${backendUrl}/api/rest/academic/unit-lessons`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        class_level: currentClass,
                        subject: selectedSubject,
                        book_type: selectedBookType
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const sortedLessons = (data.unit_lessons || []).sort((a, b) => {
                        const numA = parseInt(a.match(/^(\d+)/)?.[1] || '999');
                        const numB = parseInt(b.match(/^(\d+)/)?.[1] || '999');
                        return numA - numB;
                    });
                    setUnitLessons(sortedLessons);
                }
            } catch (error) {
                console.error('Error fetching unit lessons:', error);
            }
            setLoading(false);
        };
        
        if (selectedBookType) {
            fetchUnitLessons();
            // Load images for the book type
            const currentClass = getCurrentClass();
            if (currentClass && selectedSubject) {
                loadImages(`academic/class/${currentClass.toLowerCase()}/${selectedSubject}/${selectedBookType}`);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBookType, selectedSubject, location.pathname]);
    
    const handleSubjectClick = (subject) => {
        if (dragging) return;
        
        // Deselect if clicking same subject
        if (selectedSubject === subject) {
            setSelectedSubject(null);
            setSelectedBookType(null);
            setSelectedLesson(null);
            setBookTypes([]);
            setUnitLessons([]);
            // Load all images for this class
            const currentClass = getCurrentClass();
            if (currentClass) {
                loadImages(`academic/class/${currentClass.toLowerCase()}`);
            }
            return;
        }
        
        setSelectedSubject(subject);
        setSelectedBookType(null);
        setSelectedLesson(null);
        setUnitLessons([]);
        
        // Load images for this subject
        const currentClass = getCurrentClass();
        if (currentClass) {
            loadImages(`academic/class/${currentClass.toLowerCase()}/${subject}`);
        }
    };
    
    const handleBookTypeClick = (bookType) => {
        if (dragging) return;
        setSelectedBookType(bookType);
        setSelectedLesson(null);
    };
    
    const handleLessonClick = (lesson) => {
        if (dragging) return;
        setSelectedLesson(lesson);
        
        const currentClass = getCurrentClass();
        if (currentClass && selectedSubject && selectedBookType) {
            loadImages(`academic/class/${currentClass.toLowerCase()}/${selectedSubject}/${selectedBookType}/${lesson}`);
        }
    };
    
    const formatBookTypeName = (bookType) => {
        return bookType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    };
    
    const currentClass = getCurrentClass();
    if (!currentClass) {
        return null;
    }
    
    // Build breadcrumb path
    const getBreadcrumb = () => {
        const parts = [`Class ${currentClass.replace('CLASS-', '')}`];
        if (selectedSubject) parts.push(selectedSubject);
        if (selectedBookType) parts.push(formatBookTypeName(selectedBookType));
        if (selectedLesson) parts.push(selectedLesson);
        return parts;
    };
    
    const breadcrumb = getBreadcrumb();
    const hasSelection = selectedSubject || selectedBookType || selectedLesson;
    
    return (
        <div className="academicFilterContainer">
            {/* Breadcrumb - Shows selected path */}
            {hasSelection && (
                <div className="filterBreadcrumb">
                    <span className="breadcrumbPath">
                        {breadcrumb.map((item, idx) => (
                            <span key={idx}>
                                <span 
                                    className={idx === breadcrumb.length - 1 ? 'breadcrumbActive' : 'breadcrumbItem'}
                                    onClick={() => {
                                        // Click on breadcrumb item to go back to that level
                                        if (idx === 0) {
                                            // Class level - reset all
                                            setSelectedSubject(null);
                                            setSelectedBookType(null);
                                            setSelectedLesson(null);
                                            setBookTypes([]);
                                            setUnitLessons([]);
                                            loadImages(`academic/class/${currentClass.toLowerCase()}`);
                                        } else if (idx === 1) {
                                            // Subject level
                                            setSelectedBookType(null);
                                            setSelectedLesson(null);
                                            setUnitLessons([]);
                                            loadImages(`academic/class/${currentClass.toLowerCase()}/${selectedSubject}`);
                                        } else if (idx === 2) {
                                            // Book type level
                                            setSelectedLesson(null);
                                            loadImages(`academic/class/${currentClass.toLowerCase()}/${selectedSubject}/${selectedBookType}`);
                                        }
                                    }}
                                >
                                    {item}
                                </span>
                                {idx < breadcrumb.length - 1 && <span className="breadcrumbSeparator"> › </span>}
                            </span>
                        ))}
                    </span>
                    <button 
                        className="collapseToggle"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? '▼ Expand' : '▲ Collapse'}
                    </button>
                </div>
            )}
            
            {/* Blue Pane - Contains book types and lessons only */}
            {!isCollapsed && (selectedSubject && bookTypes.length > 0) && (
                <div className="academicBluePane">
                    {/* Book Type Tabs - Show when subject is selected */}
                    {selectedSubject && bookTypes.length > 0 && (
                        <div className="bookTypesRow">
                            {bookTypes.map((bookType) => (
                                <div
                                    key={bookType}
                                    className={`bookTypeChip ${selectedBookType === bookType ? 'active' : ''}`}
                                    onClick={() => handleBookTypeClick(bookType)}
                                >
                                    {formatBookTypeName(bookType)}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Unit/Lesson Row - Show when book type is selected */}
                    {selectedBookType && unitLessons.length > 0 && (
                        <div className="lessonsRow">
                            <ScrollMenu
                                scrollContainerClassName='lessonScrollContainer'
                                onMouseDown={() => dragStart}
                                LeftArrow={LeftArrow}
                                RightArrow={RightArrow}
                                onMouseUp={() => dragStop}
                                onMouseMove={handleDrag}
                            >
                                {unitLessons.map((lesson) => (
                                    <LessonCard
                                        key={lesson}
                                        itemId={lesson}
                                        title={lesson}
                                        selected={selectedLesson === lesson}
                                        onClick={() => handleLessonClick(lesson)}
                                    />
                                ))}
                            </ScrollMenu>
                        </div>
                    )}
                    
                    {/* Show message when no filters to display - but only for CLASS pages, not Image Bank or Sections */}
                    {false && !selectedSubject && subjects.length > 0 && !location.pathname.toLowerCase().includes('imagebank') && !location.pathname.toLowerCase().includes('sections') && !location.pathname.toLowerCase().includes('one-click') && !location.pathname.toLowerCase().includes('grade') && (
                        <div className="filterHint">
                            Select a subject from the menu above to see more filters
                        </div>
                    )}
                </div>
            )}
            
            {loading && <div className="filterLoadingIndicator">Loading...</div>}
        </div>
    );
};

function SubjectCard({ onClick, selected, title }) {
    const visibility = React.useContext(VisibilityContext);
    
    return (
        <div 
            onClick={() => onClick(visibility)} 
            className={`subjectChip ${selected ? 'selected' : ''}`}
            tabIndex={0}
        >
            {title}
        </div>
    );
}

function LessonCard({ onClick, selected, title }) {
    const visibility = React.useContext(VisibilityContext);
    
    return (
        <div 
            onClick={() => onClick(visibility)} 
            className={`lessonChip ${selected ? 'selected' : ''}`}
            tabIndex={0}
        >
            {title}
        </div>
    );
}

export default AcademicFilter;
