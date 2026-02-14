import React from 'react'
import { ScrollMenu } from "react-horizontal-scrolling-menu";
import { LeftArrow, RightArrow } from '../signUpMenu/Arrow';
import useDrag from '../signUpMenu/useDrag';
import "./ScrollElement.css"
const ScrollElement = (props) => {
    // NOTE: for drag by mouse
    const { dragStart, dragStop, dragMove } = useDrag();
    const handleDrag = ({ scrollContainer }) => (e) => dragMove(e, (posDiff) => {
        if (scrollContainer.current) {
            scrollContainer.current.scrollLeft += posDiff;
        }
    });
    // const handleItemClick = (itemId) => () => {
    //     if (dragging) {
    //         return false;
    //     }
    // };
    return (
        <ScrollMenu 
            wrapperClassName="subMenuScrollWrapper"
            separatorClassName="subMenuSeparator"
            scrollContainerClassName='subMenuListScrollContainer' 
            onMouseDown={() => dragStart} 
            LeftArrow={LeftArrow}
            RightArrow={RightArrow}
            onMouseUp={() => dragStop} 
            onMouseMove={handleDrag}>
            {props.element}
        </ScrollMenu>
    )
}
export default ScrollElement;