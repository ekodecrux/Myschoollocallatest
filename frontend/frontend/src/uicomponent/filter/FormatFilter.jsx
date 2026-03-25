import * as React from "react";
import "./FilterStyle.css";
import { ScrollMenu, VisibilityContext } from "react-horizontal-scrolling-menu";
import { LeftArrow, RightArrow } from '../../uicomponent/filter/Arrow';
import useDrag from '../../customTheme/signUpMenu/useDrag';
import "../../customTheme/signUpMenu/hideScrollBar.css";
import { newFilter, structureFilter } from './constant';
import { useLocation } from "react-router-dom";
const FormatFilter = (props) => {
    const [filtersList, setFiltersList] = React.useState(newFilter)
    const [structureFilterList, setStructureFilterList] = React.useState(structureFilter)
    const location = useLocation()
    const { dragStart, dragStop, dragMove, dragging } = useDrag();
    const handleDrag = ({ scrollContainer }) => (e) => dragMove(e, (posDiff) => {
        if (scrollContainer.current) {
            scrollContainer.current.scrollLeft += posDiff;
        }
    });
    const handleItemClick = (itemName, itemChildren, itemIndex, data) => {
        if (dragging) {
            return false;
        }
        if (data.hasOwnProperty('type')) {
            if (props.formats) {
                props.setFormat(props.formats.name !== itemName ? { name: itemName, endCode: data.endCode } : null)
            } else {
                props.setFormat({ name: itemName, endCode: data.endCode })
            }
        } else {
            if (props.docType !== itemName) {
                let data = [[...filtersList][itemIndex]]
                setFiltersList([...data, ...itemChildren])
            } else {
                setFiltersList(newFilter)
            }
            props.setDocType(props.docType !== itemName ? itemName : null)
            props.setFormat(null)
        }
    };
    const handleSelected = (data) => {
        if (data.hasOwnProperty('type')) {
            if (props.formats) {
                return data.name === props.formats.name
            }
        } else {
            return data.name === props.docType
        }
    }
    return (
        <div className="filterContainer">
            <div className="filterSelector">
                <div style={{ maxWidth: "-webkit-fill-available" }}>
                    <ScrollMenu
                        scrollContainerClassName='signUpScrollContainer'
                        onMouseDown={() => dragStart}
                        LeftArrow={LeftArrow}
                        RightArrow={RightArrow}
                        onMouseUp={() => dragStop}
                        onMouseMove={handleDrag}
                        style={{ width: '0px !important' }}>
                        {filtersList.map((k, i) => (
                            <Card
                                itemId={k.name} // NOTE: itemId is required for track items
                                title={k.name}
                                key={k.name}
                                onClick={() => handleItemClick(k.name, k.children, i, k)}
                                selected={handleSelected(k)}
                            />
                        ))}
                    </ScrollMenu>
                </div>
            </div>
        </div>
    );
}
function Card({ onClick, selected, title }) {
    const visibility = React.useContext(VisibilityContext);
    return (
        <div onClick={() => onClick(visibility)} style={{ minWidth: '80px', width: 'auto', paddingRight: '8px' }} tabIndex={0}>
            <p className={selected ? "filterItemActive" : "filterItem"}
               style={{margin:0, whiteSpace: 'nowrap'}} unselectable="on">{title}</p>
        </div>
    )
}
export default FormatFilter;
