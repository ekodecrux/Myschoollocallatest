import React from "react";
import { ReactComponent as LeftArrowIcon } from "../../assests/signupScreen/LeftArrow.svg";
import { ReactComponent as RightArrowIcon } from "../../assests/signupScreen/RightArrow.svg";
import { VisibilityContext } from "react-horizontal-scrolling-menu";
import { useLocation } from "react-router-dom";
const Arrow = ({ children, disabled, onClick }) => {
    var location = useLocation();
    var path = location.pathname;
    var pathName = location.pathname.split('/').filter(el => el).filter(el => el !== "views")[0]
    return (
        path === '/' ? (
            <button
                disabled={disabled}
                onClick={onClick}
                style={{
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    right: "1%",
                    opacity: disabled ? "0" : "1",
                    userSelect: "none",
                    border: "none",
                    backgroundColor: "#DDD9C3"
                }}
            >
                {children}
            </button>
        ) : (
            <button
                disabled={disabled}
                onClick={onClick}
                style={{
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    right: "1%",
                    opacity: disabled ? "0" : "1",
                    userSelect: "none",
                    border: "none",
                    borderRadius: "22px",
                    // opacity: "1",
                    // backgroundColor: "#5787E9",
                    background: "transparent linear-gradient(180deg, #5787E9 0%, #335089 100%) 0% 0% no-repeat padding-box",
                    padding: "7px",
                }}
            >
                {children}
            </button >
        )
    );
}
export const LeftArrow = () => {
    let location = useLocation();
    let path = location.pathname
    const {
        isFirstItemVisible,
        scrollPrev,
        visibleItemsWithoutSeparators,
        initComplete
    } = React.useContext(VisibilityContext);
    const [disabled, setDisabled] = React.useState(
        !initComplete || (initComplete && isFirstItemVisible)
    );
    React.useEffect(() => {
        // NOTE: detect if whole component visible
        if (visibleItemsWithoutSeparators.length) {
            setDisabled(isFirstItemVisible);
        }
    }, [isFirstItemVisible, visibleItemsWithoutSeparators]);
    return (
        <Arrow disabled={disabled} onClick={() => scrollPrev()}>
            { path === '/' ? <LeftArrowIcon style={{ color: 'black' }} /> : <LeftArrowIcon style={{ color: 'white' }} />}
        </Arrow>
    );
}
export const RightArrow = () => {
    let location = useLocation();
    let path = location.pathname
    const {
        isLastItemVisible,
        scrollNext,
        visibleItemsWithoutSeparators
    } = React.useContext(VisibilityContext);
    const [disabled, setDisabled] = React.useState(
        !visibleItemsWithoutSeparators.length && isLastItemVisible
    );
    React.useEffect(() => {
        if (visibleItemsWithoutSeparators.length) {
            setDisabled(isLastItemVisible);
        }
    }, [isLastItemVisible, visibleItemsWithoutSeparators]);
    return (
        <Arrow disabled={disabled} onClick={() => scrollNext()}>
            { path === '/' ? <RightArrowIcon style={{ color: 'black' }} /> : <RightArrowIcon style={{ color: 'white' }} />}
        </Arrow>
    );
}
