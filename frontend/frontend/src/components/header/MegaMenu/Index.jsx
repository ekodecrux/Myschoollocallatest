import React, { Fragment, useEffect } from "react";
import "./Index.css";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import ItemsContainer from "./ItemsContainer/ItemsContainer.jsx";
import ScrollElement from "../../../customTheme/scrollElement/ScrollElement";
import { isMobile } from "react-device-detect";
const MegaMenu = (props) => {
  const chunkArray = (array, chunkSize) => {
    const chunkedArray = [];
    let index = 0;
    while (index < array.length) {
      chunkedArray.push(array.slice(index, index + chunkSize));
      index += chunkSize;
    }
    return chunkedArray;
  }
  if (props.data !== null) {
    return (
      <div className="megaMenuContainer" style={props.style}>
        <div className="homeGutter" />
        <div className="megaMenuWrapper">
          <div className="megaMenuItems">
            {!isMobile ? <ScrollElement element={
              props.data?.children && props.data?.children.map((k, i) => {
                if (k.children?.length >= 8) {
                  // Menu rendered
                  return (chunkArray(k.children, 8).map((c_k, c_i) =>
                    <ItemsContainer
                      getPrevPath={props.getPrevPath}
                      key={`itemContainer-${i}-${c_i}`}
                      parent={k.title}
                      categoryTitle={props.categoryTitle}
                      data={c_k}
                      heading={c_i === 0 ? k.title : null} />
                  )
                  )
                }
                return (
                  <ItemsContainer
                    getPrevPath={props.getPrevPath}
                    key={`itemContainer-${i}`}
                    parent={k.title}
                    categoryTitle={props.categoryTitle}
                    data={k?.children}
                    heading={k?.title} />
                )
              }
              )
            } /> : <>
              {props.data?.children && props.data?.children.map((k, i) =>
                <ItemsContainer getPrevPath={props.getPrevPath} key={`itemContainer-${i}`} parent={k.title} categoryTitle={props.categoryTitle} data={k?.children} heading={k?.title} />)}
            </>}
          </div>
        </div>
        <div className="homeGutter" />
      </div>
    );
  } else {
    return (
      <></>
    )
  }
};
export default MegaMenu;
