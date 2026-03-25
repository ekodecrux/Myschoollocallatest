import React, { useEffect, useState } from "react";
import FormatFilter from "../../../uicomponent/filter/FormatFilter";
import ImageRenderer from "../../auth/views/imageRenderer/ImageRenderer";
import { useSelector, useDispatch } from "react-redux";
import { SearchImages } from "../../../redux/fetchSearchSlice";
import { useLocation } from "react-router-dom";
import { isMobile } from "react-device-detect";
import SelectImage from "../academics/selectImage";
import { Modal } from "@mui/material";
import { Login } from "../../auth/login/Login";
import { SignUp } from "../../auth/signUp/SignUp";
import "../academics/Academics.css";
const Results = () => {
  const { searchedImages, loading } = useSelector(
    (state) => state.searchedImage
  );
  const { continuationToken } = useSelector(state => state.api);
  const [open, setOpen] = useState(false);
  const [noSelectImage, setNoSelectImage] = useState([]);
  const [tab, setTab] = useState(0);
  // State for File format filters 
  const [formats, setFormat] = useState(null)        // formats of files like png , jpg, gif, pdf etc
  const [docType, setDocType] = useState(null)      // state for type of file document like Images, Videos, Animations, etc
  const [searchedImage, setSearchedImage] = React.useState({});
  const location = useLocation();
  const dispatch = useDispatch();
  
  React.useEffect(() => {
    const searchQuery = location?.search?.replace("?text=", "")?.toLowerCase() || "";
    if (searchQuery) {
      dispatch(
        SearchImages({
          method: "GET",
          body: {
            query: decodeURIComponent(searchQuery),
            size: 100
          },
        })
      ).then((res) => {
        // Transform results array to object format expected by ImageRenderer
        // ImageRenderer expects { "path/to/file.jpg": "full_url", ... }
        const results = res.payload?.data || [];
        const transformedData = {};
        results.forEach((item) => {
          // Use path or title as key, and path as value (URL)
          const key = item.path || item.title || '';
          if (key) {
            transformedData[key] = item.path || item.thumbnail || '';
          }
        });
        setSearchedImage(transformedData);
      }).catch((err) => {
        setSearchedImage({});
      });
    }
  }, [location?.search, dispatch]);
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
      <div className="academicsContainer">
        <div className={isMobile ? "mobGutter" : "homeGutter"} />
        <div className="academicsWrapper">
          <FormatFilter 
              formats={formats}
              setFormat={setFormat}
              docType={docType}
              setDocType={setDocType} 
          />
          <ImageRenderer
              openLogin={setOpen}
              pageType="result"
              loading={loading}
              data={searchedImage}
              token={continuationToken}
              addedImages={noSelectImage}
              addToNoSelectImage={selectPicture}
              selectedFilters={formats}
          />
        </div>
        <div className={isMobile ? "mobGutter" : "homeGutter"} />
      </div>
      {/* Render Modal for the Auth Section */}
      <Modal className="openModal" onClose={handleClose} open={open}>
        {tab === 0 ? (
          <Login changeTab={() => setTab(tab === 0 ? 1 : 0)} />
        ) : (
          <SignUp changeTab={() => setTab(tab === 0 ? 1 : 0)} />
        )}
      </Modal>
    </>
  );
};
export default Results;
