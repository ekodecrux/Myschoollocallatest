import React from 'react'
import { ScrollMenu, VisibilityContext } from "react-horizontal-scrolling-menu";
import { LeftArrow, RightArrow } from './Arrow';
import useDrag from './useDrag';
import "./hideScrollBar.css";
var roles = ['Student', 'Teacher', 'School', 'Parent',  'Publisher']
const ScrollMenuBtn = (props) => {
    const [items] = React.useState(roles);
    // const [selected, setSelected] = React.useState("Student");
    // NOTE: for drag by mouse
    const { dragStart, dragStop, dragMove, dragging } = useDrag();
    const handleDrag = ({ scrollContainer }) => (e) => dragMove(e, (posDiff) => {
        if (scrollContainer.current) {
            scrollContainer.current.scrollLeft += posDiff;
        }
    });
    const handleItemClick = (itemId) => () => {
        if (dragging) {
            return false;
        }
        // Only switch roles, don't allow deselecting to null
        // This prevents errors when formFields[null] would be accessed
        if (props.userRole !== itemId) {
            props.setUserRole(itemId);
        }
        // Clicking the same role does nothing - role cannot be deselected
    };
    return (
        <ScrollMenu 
            scrollContainerClassName='signUpScrollContainer' 
            onMouseDown={() => dragStart} 
            LeftArrow={LeftArrow}
            RightArrow={RightArrow}
            onMouseUp={() => dragStop} 
            onMouseMove={handleDrag}>
            {items.map((k, i) => (
                <Card
                    itemId={k} // NOTE: itemId is required for track items
                    title={k}
                    key={k}
                    onClick={handleItemClick(k)}
                    selected={k === props.userRole}
                />
            ))}
        </ScrollMenu>
    )
}
function Card({ onClick, selected, title }) {
    const visibility = React.useContext(VisibilityContext);
    return (
        <div onClick={() => onClick(visibility)} style={{ minWidth: '90px', width: 'auto', display:'flex', alignItems:'center', paddingRight: '8px'}} tabIndex={0}>
            <p className={selected ? "roleTextActive" : "roleText"} style={{height:26, whiteSpace: 'nowrap'}} unselectable="on">{title}</p>
        </div>
    )
}
export default ScrollMenuBtn;