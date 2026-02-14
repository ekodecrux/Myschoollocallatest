import { Button, IconButton, Skeleton, Stack, Typography, Box, Drawer, CircularProgress } from "@mui/material";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Pagination from "@mui/material/Pagination";
import "./imageRenderer.css";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ReactComponent as PrintIcon } from "../../../../assests/actionIcons/printIcon.svg";
import { ReactComponent as SaveToCloudIcon } from "../../../../assests/actionIcons/cloudSave.svg";
import { ReactComponent as CloseIcon } from "../../../../assests/closeIcon.svg";
import { ReactComponent as AudioIcon } from "../../../../assests/actionIcons/music-icon.svg";
import { ReactComponent as VideoIcon } from "../../../../assests/actionIcons/video-play-icon.svg";
import { ReactComponent as LeftArrowIcon } from "../../../../assests/signupScreen/LeftArrow.svg";
import { ReactComponent as RightArrowIcon } from "../../../../assests/signupScreen/RightArrow.svg";
import { ReactComponent as ZoomInIcon } from "../../../../assests/signupScreen/ZoomIn.svg";
import { ReactComponent as ZoomOutIcon } from "../../../../assests/signupScreen/ZoomOut.svg";
import { ReactComponent as FavIcon } from "../../../../assests/actionIcons/favIcon.svg";
import { ReactComponent as FavIconFilled } from "../../../../assests/actionIcons/favIconFIlled.svg";
import { useReactToPrint } from "react-to-print";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { DeleteMyImages, SaveMyImages, AddToFavourites, RemoveFromFavourites } from "../../../../redux/addImagesSlice";
import { useDispatch } from "react-redux";
import { RefreshToken } from "../../../../redux/authSlice";
import { loadSingleImage } from "../../../../redux/loadOldImage";
import { fileType } from "../../../../uicomponent/filter/constant";
import { SearchImages } from "../../../../redux/fetchSearchSlice";
import { useSnackbar } from "../../../../hook/useSnackbar";
import { useCredits } from "../../../../hook/useCredits";
// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
// Options for Rect-pdf viewer
const options = {
  cMapUrl: "cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "standard_fonts/",
};
// PDF Thumbnail Component with preview
const PdfThumbnail = ({ pdfUrl, thumbnailUrl, onLoad }) => {
  const [previewError, setPreviewError] = useState(false);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  
  // Get the image URL to display
  const getImageUrl = () => {
    // If we have a valid thumbnail URL that's not a PDF, use it directly
    if (thumbnailUrl && thumbnailUrl.includes('.webp')) {
      return thumbnailUrl;
    }
    // Fall back to backend PDF thumbnail generation using the PDF URL
    if (pdfUrl) {
      const encodedUrl = encodeURIComponent(pdfUrl);
      return `${backendUrl}/api/rest/images/pdf-thumbnail?url=${encodedUrl}&width=144&height=185`;
    }
    return null;
  };
  
  const imageUrl = getImageUrl();
  
  if (!imageUrl || previewError) {
    // Fallback: Show static PDF icon
    return (
      <div style={{
        width: 144,
        height: 185,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff5f5',
        borderRadius: '8px',
        border: '1px solid #ffcdd2'
      }}>
        <div style={{ fontSize: '40px', color: '#d32f2f' }}>📄</div>
        <span style={{ color: '#d32f2f', fontSize: '10px', fontWeight: 'bold', marginTop: '8px' }}>PDF DOCUMENT</span>
      </div>
    );
  }
  
  return (
    <div style={{ width: 144, height: 185, position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
      <img 
        src={imageUrl}
        alt="PDF Preview"
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#f5f5f5' }}
        onLoad={() => {
          if (onLoad) onLoad();
        }}
        onError={(e) => {
          console.error('PDF thumbnail failed:', imageUrl);
          setPreviewError(true);
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '24px',
        backgroundColor: 'rgba(211, 47, 47, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>PDF</span>
      </div>
    </div>
  );
};

const ImageRenderer = (props) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [page, setPage] = React.useState(1); //Number of pages in a Pdf File
  const [pageCount, setPageCount] = React.useState(1); // Total number of pages
  const [itemsPerPage, setItemsPerPage] = React.useState(21)
  const [open, setOpen] = React.useState(false); // For side Resize image renderer open and close
  const [load, setLoad] = React.useState(false); // For image loading for skeleton
  const [oldData, setOldData] = React.useState(props.data); // For saving data coming in props
  const [selectedItem, setSelectedItem] = React.useState(null); // For side Resize image open
  const [isFavourite, setIsFavourite] = React.useState(false); // For tracking if current image is favourite
  const printableDiv = React.useRef(); // Ref for printable div
  
  // Print handler using the hook
  const handlePrint = useReactToPrint({
    contentRef: printableDiv,
    pageStyle: "@page { scale : custom 50 }",
  });
  
  const { isLoggedin, accessToken, refreshToken } = useSelector(
    (state) => state.login
  ); // Check if user logged in or not from store
  const [addedImage, setAddedImage] = React.useState(false); // Check if resize image in selected array or not
  // const [addedMultipleImage, setAddedMultipleImage] = React.useState(false);
  const [nextImgDisabled, setNextImgDisabled] = React.useState(false);
  const [preImgDisabled, setPreImgDisabled] = React.useState(false);
  // const { images } = useSelector((state) => state.imagesData)
  const { pagination } = useSelector((state) => state.searchedImage);
  const { displaySnackbar } = useSnackbar();
  const { useCredits: deductCredits, loading: creditsLoading } = useCredits();
  // -------------Counter for image Load-----------------
  const counter = React.useRef(0);
  const zoomRef = React.useRef(null);
  // ----------------------------------------------------
  // --------------For pdf renderer-----------------
  const [noPages, setNoPages] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  // -----------------------------------------------
  
  // Toggle favourite status for current image
  const handleToggleFavourite = async () => {
    if (!isLoggedin) {
      props.openLogin && props.openLogin(true);
      return;
    }
    
    // For MyImages view, get the image ID from the array
    if (props.place === "MyImages" && selectedItem?.fileName && Array.isArray(oldData)) {
      const imageData = oldData.find(ele => ele.objectKey === selectedItem.fileName);
      const imageId = imageData?.id;
      if (!imageId) {
        displaySnackbar({ message: "Cannot find image ID" });
        return;
      }
      
      let header = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      };
      
      const action = isFavourite ? RemoveFromFavourites : AddToFavourites;
      
      dispatch(action({
        headers: header,
        body: { ids: [imageId] }
      })).then((res) => {
        if (res.payload?.message === "Expired JWT") {
          dispatch(RefreshToken({
            headers: header,
            body: { "refreshToken": refreshToken }
          })).then((refreshRes) => {
            header["Authorization"] = `Bearer ${refreshRes.payload.accessToken}`;
            dispatch(action({
              headers: header,
              body: { ids: [imageId] }
            })).then(() => {
              setIsFavourite(!isFavourite);
              displaySnackbar({ message: isFavourite ? "Removed from favourites" : "Added to favourites" });
              if (props.getMyImages) props.getMyImages();
            });
          });
        } else {
          setIsFavourite(!isFavourite);
          displaySnackbar({ message: isFavourite ? "Removed from favourites" : "Added to favourites" });
          if (props.getMyImages) props.getMyImages();
        }
      }).catch((err) => {
        console.error("Favourite toggle error:", err);
        displaySnackbar({ message: "Failed to update favourite status" });
      });
    } else {
      // For other views (Academics, Sections, etc.), first save the image then it can be favourited
      displaySnackbar({ message: "First save this image to 'My Images', then you can mark it as favourite from your Dashboard" });
    }
  };
  
  // Function handle on change of props.selectedFilter
  useEffect(() => {
    // Add null check for props.data
    if (!props.data || typeof props.data !== 'object') {
      setOldData({});
      setPage(1);
      setPageCount(0);
      setOpen(false);
      setLoad(false);
      counter.current = 0;
      return;
    }
    const filterType = props.selectedFilters?.endCode
    const imageArray = Object.keys(props.data)
    let filteredData = props.data;
    if (filterType) {
      let newImageList = {}
      imageArray.forEach((k) => {
        let imageEndCode = returnImageName(k).slice(-3)
        if (filterType.includes(imageEndCode)) newImageList[k] = props.data[k]
      })
      filteredData = newImageList;
      setOldData(newImageList)
    } else {
      setOldData(props.data)
    }
    setOpen(false);
    setLoad(false);
    counter.current = 0;
    setPage(1);
    // Calculate page count based on filtered data
    if (props.pageType === 'result') {
      setPageCount(pagination)
    } else {
      // Filter for displayable files (images and PDFs)
      const displayableImages = Object.keys(filteredData || {}).filter((ele) => {
        const lowerEle = ele.toLowerCase();
        return lowerEle.includes('.webp') || lowerEle.includes('.jpg') || 
               lowerEle.includes('.jpeg') || lowerEle.includes('.png') || 
               lowerEle.includes('.gif') || lowerEle.includes('.pdf');
      });
      setPageCount(Math.ceil(displayableImages.length / 21))
    }
  }, [props?.selectedFilters, props.data, pagination, props.pageType])
  // Function handle page change actions
  // on Pagination change
  // @params (value of that page)
  const handlePageChange = (event, value) => {
    setLoad(false);
    counter.current = 0;
    setPage(value);
    if (props.pageType === 'result') {
      let lastPath = Object.keys(oldData || {}).reverse()[0]
      if (Object.keys(oldData || {}).length / 21 < value) {
        let dataSize = Math.ceil(value - Object.keys(oldData || {}).length / 21) * 21
        dispatch(
          SearchImages({
            method: "GET",
            body: {
              query: location?.search.replace("?text=", "").toLowerCase(),
              size: dataSize,
              lastPath: lastPath
            },
          })
        ).then((res) => {
          setOldData((current) => {
            let copy = { ...current };
            copy = { ...copy, ...res.payload.data }
            return copy;
          });
        })
      }
    }
  };
  // Function for opening Resize window image if thumbnail is there
  // @params (item details of that file)
  const handleSingleImage = (item) => {
    var itemFileName = item.fileName.split('/').filter((ele) => ele !== "thumbnails")
    let realFileName = item.tittle.slice(-3)
    let extension = fileType[`${realFileName}`]
    let newFileNamePath = ""
    let result = item.tittle
    let newTitle = itemFileName.pop()
    let newArray = itemFileName.push(`${result}.${extension}`)
    newFileNamePath = itemFileName.join('/')
    let header = {
      "Content-Type": "application/json"
    }
    dispatch(loadSingleImage({
      url: "/rest/images/fetch",
      header: header,
      method: "post",
      body: { folderPath: newFileNamePath, imagesPerPage: 100 }
    })).then((res) => {
      // item.fileName = res.payload.list[newFileNamePath];
      item.url = res.payload.list[newFileNamePath];
      item.fileType = returnImageType(newFileNamePath)
      setSelectedItem(item);
    })
  }
  // Function for opening Resize window
  // @params (item details of that file)
  const handleImageResize = (item) => {
    // Disable left arrow for first image (index 0)
    if (item?.fileIndex === 0) {
      setPreImgDisabled(true)
    } else {
      setPreImgDisabled(false)
    }
    
    // Compute chunkData locally to determine last image in current page
    let newImageData = [];
    if (props.place === 'MyImages' && Array.isArray(oldData)) {
      newImageData = [...new Set(oldData.map(k => k.objectKey))];
    } else {
      const hasImageExtensions = Object.keys(oldData || {}).toString().includes('.webp') || 
                                  Object.keys(oldData || {}).toString().includes('.pdf');
      if (hasImageExtensions) {
        newImageData = Object.keys(oldData || {}).filter((ele) => {
          const lowerEle = ele.toLowerCase();
          return lowerEle.includes('.webp') || lowerEle.includes('.pdf') ||
                 lowerEle.includes('.jpg') || lowerEle.includes('.jpeg') ||
                 lowerEle.includes('.png') || lowerEle.includes('.gif');
        });
      } else {
        newImageData = Object.keys(oldData || {});
      }
    }
    // Filter for displayable files
    newImageData = newImageData.filter((ele) => {
      const lowerEle = ele.toLowerCase();
      return lowerEle.includes('.webp') || lowerEle.includes('.jpg') || 
             lowerEle.includes('.jpeg') || lowerEle.includes('.png') || 
             lowerEle.includes('.gif') || lowerEle.includes('.pdf');
    });
    
    const chunkData = sliceIntoChunks(newImageData, 21);
    const currentPageData = (chunkData[page - 1] || []);
    
    // Disable right arrow for last image in current page
    const isLastImage = item?.fileIndex === currentPageData.length - 1;
    if (isLastImage) {
      setNextImgDisabled(true)
    } else {
      setNextImgDisabled(false)
    }
    item?.fileType === "webp" ? handleSingleImage(item) : setSelectedItem(item)
    item !== null ? setOpen(true) : setOpen(false);
    if (
      !open &&
      props.addedImages && props.addedImages.findIndex((el) => el.fileName === item?.fileName) >= 0
    ) {
      setAddedImage(true);
    } else {
      setAddedImage(false);
    }
    // Set favourite status for MyImages view
    if (props.place === "MyImages" && item?.fileName && Array.isArray(oldData)) {
      const imageData = oldData.find(ele => ele.objectKey === item.fileName);
      setIsFavourite(imageData?.is_favourite || false);
    } else {
      setIsFavourite(false);
    }
  };
  // Function return name of the image
  // excluding extension
  // @params (name of the file)
  const returnImageName = (name) => {
    return name?.split("/")
    [name?.split("/")?.length - 1]?.split(".")[0]
      .replaceAll("_", " ");
  };
  // Function return type of the image
  // excluding extension
  // @params (Type of the file)
  const returnImageType = (name) => {
    return name
      .split("/")
    [name.split("/").length - 1].split(".")[1]
      .replaceAll("_", " ");
  };
  // Function will slice a big array in chunks
  // of supplied size
  // @params [array, chunksize]
  const sliceIntoChunks = (arr, chunkSize) => {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      res.push(chunk);
    }
    return res;
  };
  // Function handle image loading
  // @param [data] --> images data of current page
  const handleImageOnLoad = (data) => {
    counter.current += 1;
    if (counter.current >= data?.length) {
      setLoad(true);
    }
  };
  // Function for navigating previous & next image in image resize window
  // @params (direction +1 or -1)
  const handleImageNavigation = (dir) => {
    // Safety check - if no data, don't navigate
    if (!oldData || Object.keys(oldData || {}).length === 0) {
      return;
    }
    /* Some files are empty because there is no file extension. So it will remove empty file if there is no
     .webp extension after filtering. */
    let imageData = Object.keys(oldData || {}).toString().includes('.webp') || 
                    Object.keys(oldData || {}).toString().includes('.pdf');
    let newImageData = []
    if (imageData) {
      newImageData = Object.keys(oldData || {}).filter((ele) => {
        const lowerEle = ele.toLowerCase();
        return lowerEle.includes('.webp') || lowerEle.includes('.pdf') ||
               lowerEle.includes('.jpg') || lowerEle.includes('.jpeg') ||
               lowerEle.includes('.png') || lowerEle.includes('.gif');
      });
    } else {
      newImageData = Object.keys(oldData || {});
    }
    if (props.place === 'MyImages' && Array.isArray(oldData)) {
      var myImageData = oldData.map((k, i) => {
        return k = k.objectKey;
      })
      newImageData = [...new Set(myImageData)]
    }
    // Filter for displayable files (images and PDFs)
    newImageData = newImageData.filter((ele) => {
      const lowerEle = ele.toLowerCase();
      return lowerEle.includes('.webp') || lowerEle.includes('.jpg') || 
             lowerEle.includes('.jpeg') || lowerEle.includes('.png') || 
             lowerEle.includes('.gif') || lowerEle.includes('.pdf');
    });
    // Safety check - no images to navigate
    if (newImageData.length === 0) {
      return;
    }
    let chunkData = sliceIntoChunks(newImageData, 21);
    // Safety check - invalid page
    if (!chunkData[page - 1] || chunkData[page - 1].length === 0) {
      return;
    }
    let chunkDataIndex = chunkData[page - 1].findIndex(
      (ele) => ele === selectedItem?.fileName
    );
    // Safety check - item not found
    if (chunkDataIndex === -1) {
      chunkDataIndex = 0;
    }
    const newIndex = chunkDataIndex + dir;
    // Boundary check
    if (newIndex < 0 || newIndex >= chunkData[page - 1].length) {
      return;
    }
    let nextImageKey = chunkData[page - 1][newIndex];
    // Safety check - no next image
    if (!nextImageKey) {
      return;
    }
    let fileType = nextImageKey?.split(".");
    
    // Get the URL - handle both array (MyImages) and object formats
    let imageUrl;
    if (props.place === 'MyImages' && Array.isArray(oldData)) {
      const imageObj = oldData.find(img => img.objectKey === nextImageKey);
      imageUrl = imageObj?.url || imageObj?.thumbnail_url || nextImageKey;
    } else {
      imageUrl = oldData[nextImageKey];
    }
    
    let item = {
      url: imageUrl,
      fileName: nextImageKey,
      tittle: returnImageName(nextImageKey),
      fileType: fileType?.length ? fileType[fileType?.length - 1] : "none",
      fileIndex: newIndex,
    }
    if (item?.fileIndex === 0) {
      setPreImgDisabled(true)
    } else {
      setPreImgDisabled(false)
    }
    if (item?.fileIndex === itemsPerPage-1 || item?.fileIndex === chunkData[page - 1].length - 1) {
      setNextImgDisabled(true)
    } else {
      setNextImgDisabled(false)
    }
    item.fileType === "webp" ? handleSingleImage(item) : setSelectedItem(item);
    // var imageAdded = props.addedImages.findIndex((el) => el.fileName === item?.fileName) >= 0
    if (
      !open && props.addedImages &&
      props.addedImages.findIndex((el) => el.fileName === item?.fileName) >= 0
    ) {
      setAddedImage(true);
      // setAddedMultipleImage(true);
    } else {
      setAddedImage(false);
      // setAddedMultipleImage(false);
    }
  };
  // Function handle rendering of all images
  const renderImages = () => {
    let data = !Array.isArray(oldData) ? (oldData || {}) : {};
    let flag = Array.isArray(oldData);
    if (flag && oldData) {
      oldData.map((k, i) => {
        data[k.objectKey] = k.url;
      });
    }
    // Filter for displayable files (images and PDFs)
    data = Object.keys(data || {}).filter((ele) => {
      const lowerEle = ele.toLowerCase();
      return lowerEle.includes('.webp') || lowerEle.includes('.jpg') || 
             lowerEle.includes('.jpeg') || lowerEle.includes('.png') || 
             lowerEle.includes('.gif') || lowerEle.includes('.pdf');
    })
    data = sliceIntoChunks(data, 21);
    if (data[page-1] && data[page-1]?.length !== itemsPerPage) setItemsPerPage(data[page-1].length)
    if ((!oldData || (Array.isArray(oldData) && oldData.length === 0) || Object.keys(oldData || {}).length === 0) && props.loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px', padding: '40px' }}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="textSecondary">Loading content...</Typography>
        </div>
      );
    } else if ((!oldData || (Array.isArray(oldData) && oldData.length === 0) || Object.keys(oldData || {}).length === 0) && !props.loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px', padding: '40px', textAlign: 'center' }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#bdbdbd">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 500 }}>
            No images found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {props.place === "MyImages" ? "Save images from the Image Bank to see them here" : 
             props.place === "FavImages" ? "Mark images as favourite to see them here" :
             "No images available in this section"}
          </Typography>
        </div>
      );
    } else {
      return (
        <div className={["imagesContainer", open ? "grid-col4" : ""].join(" ")}>
          {data[page - 1]?.map((key, index) => {
            let fileType = key.split(".");
            fileType = fileType[fileType.length - 1];
            if (returnImageName(key) !== "") {
              return (
                <div
                  className="imagesSubContainer"
                  key={`images-${index}`}
                  onClick={() => {
                    let imageUrl;
                    let thumbnailUrl;
                    if (props.place === "MyImages") {
                      const imgIndex = oldData.findIndex((ele) => ele.objectKey === key);
                      imageUrl = imgIndex >= 0 ? oldData[imgIndex]?.url : key;
                      thumbnailUrl = imgIndex >= 0 ? oldData[imgIndex]?.thumbnail_url : null;
                    } else {
                      // For PDFs, key is the PDF URL, oldData[key] is the thumbnail
                      if (fileType === "pdf") {
                        imageUrl = key;  // PDF URL
                        thumbnailUrl = oldData[key];  // Thumbnail URL
                      } else {
                        imageUrl = oldData[key];
                        thumbnailUrl = null;
                      }
                    }
                    handleImageResize({
                      url: imageUrl,
                      tittle: returnImageName(key),
                      fileName: key,
                      fileType: fileType,
                      fileIndex: index,
                      thumbnailUrl: thumbnailUrl,
                    });
                  }}
                >
                  {/* {renderSkeleton()} */}
                  {fileType === "pdf" ?
                    <PdfThumbnail 
                      pdfUrl={key}  
                      thumbnailUrl={props.place === "MyImages"
                        ? (() => {
                            const idx = oldData.findIndex((ele) => ele.objectKey === key);
                            return idx >= 0 ? oldData[idx]?.thumbnail_url : null;
                          })()
                        : oldData[key]}
                      onLoad={() => handleImageOnLoad(data[page - 1])}
                    />
                    :
                    <img
                      alt=""
                      className="imageRendererWidth"
                      loading="lazy"
                      src={
                        props.place === "MyImages"
                          ? (() => {
                              const idx = oldData.findIndex((ele) => ele.objectKey === key);
                              return idx >= 0 ? oldData[idx]?.url : key;
                            })()
                          : oldData[key]
                      }
                      onContextMenu={() => false}
                      // style={{ display: !load ? "none" : "block" }}
                      onLoad={() => handleImageOnLoad(data[page - 1])}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22144%22%20height%3D%22185%22%20viewBox%3D%220%200%20144%20185%22%3E%3Crect%20fill%3D%22%23f5f5f5%22%20width%3D%22144%22%20height%3D%22185%22%2F%3E%3Ctext%20fill%3D%22%23999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3EImage%20Not%20Found%3C%2Ftext%3E%3C%2Fsvg%3E';
                      }}
                    />
                  }
                  <Typography
                    fontSize="13px"
                    fontWeight="bold"
                    paddingTop="15px"
                    color="black"
                  >
                    {returnImageName(key)}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontSize="12px"
                    color="black"
                    textTransform="lowercase"
                  >
                    www.myschool.in
                  </Typography>
                </div>
              );
            }
          })}
        </div>
      );
    }
  };
  // Function to render skeleton
  const renderSkeleton = () => {
    return (
      <Skeleton
        width={144}
        height={185}
        style={{ display: load ? "none" : "block", transform: "none" }}
      />
    );
  };
  // Function to download img or pdf or gif or any file type
  const downloadImage = async () => {
    // Check if user logged in
    if (!isLoggedin) {
      props.openLogin(true);
      return;
    }
    
    // Ensure we have a valid URL to download
    let downloadUrl = selectedItem?.url;
    if (!downloadUrl) {
      displaySnackbar({ message: "Cannot download: Image URL not available" });
      return;
    }
    
    // Deduct 1 credit for download
    const creditResult = await deductCredits(1, 'download');
    if (!creditResult.success) {
      // User doesn't have enough credits - message already shown by hook
      return;
    }
    
    // Save to MyImages and proceed with download
    if (isLoggedin) {
      var myImagesData = []
      myImagesData.push(selectedItem?.fileName)
      let header = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
      let data = {
        images: myImagesData,
        markFavourite: false
      }
      dispatch(SaveMyImages({
        headers: header,
        body: data
      })).then((res) => {
        if (res.payload?.message === "Expired JWT") {
          dispatch(RefreshToken({
            headers: header,
            body: {
              "refreshToken": refreshToken
            }
          })).then((res) => {
            header["Authorization"] = `Bearer ${res.payload.accessToken}`
            dispatch(SaveMyImages({
              headers: header,
              body: data
            }))
          })
        }
      })
      }
      // Dynamic path for downloading file
      var itemFileName = selectedItem.fileName.split('/').filter((ele) => ele !== "thumbnails")
      let realFileName = selectedItem.tittle.slice(-3)
      let extension = fileType[`${realFileName}`]
      let newFileNamePath = ""
      let result = selectedItem.tittle
      let newTitle = itemFileName.pop()
      let newArray = itemFileName.push(`${result}.${extension}`)
      newFileNamePath = itemFileName.join('/')
      selectedItem.fileName = newFileNamePath
      
      // Use backend proxy to download and bypass CORS
      try {
        const proxyUrl = `${process.env.REACT_APP_BACKEND_URL}/api/rest/images/download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(selectedItem.fileName || 'download')}`;
        
        const response = await fetch(proxyUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", selectedItem.fileName || 'download');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        displaySnackbar({ message: "Download complete" });
      } catch (error) {
        console.error("Download error:", error);
        displaySnackbar({ message: "Download failed. Please try again." });
      }
    };
    const handleClose = () => {
      setOpen(false);
      setPdfPage(1);
    };
    const deleteImage = () => {
      let selectedFileName = oldData.filter((ele) =>
        ele.objectKey === selectedItem.fileName
      )
      let selectedFileID = selectedFileName.map((k) => {
        return k = k.id;
      })
      if (location.pathname === "/auth/images") {
        let header = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Access-Control-Allow-Origin": "*",
        };
        // Fixed: Backend expects { ids: [...] } not just [...]
        let data = { ids: selectedFileID };
        dispatch(
          DeleteMyImages({
            headers: header,
            body: data,
          })
        ).then((res) => {
          if (res.payload === 'Success') {
            displaySnackbar({ message: "Image Deleted" })
            setOpen(false);
            props.getMyImages();
            // props.getFavImages();
          }
          if (res.payload.status === 401) {
            dispatch(
              RefreshToken({
                headers: header,
                body: {
                  refreshToken: refreshToken,
                },
              })
            ).then((res) => {
              header["Authorization"] = `Bearer ${res.payload.accessToken}`;
              dispatch(
                DeleteMyImages({
                  headers: header,
                  body: data,
                })
              );
            });
          }
        });
      }
    };
    var path = location.pathname
      .split("/")
      .filter((el) => el)
      .filter((el) => el !== "views");
    return (
      <div className="mainContainer">
        <div className="imageWrapper">
          <div
            className="imageResize"
            style={open ? { display: "flex" } : { display: "none" }}
          />
          <div
            className={["imageResize", open ? "imageResizePosition" : ""].join(
              " "
            )}
            style={open ? { display: "flex", flex: 1 } : { display: "none" }}
          ></div>
          {/* -------------Pagination starts here----------------- */}
          <div style={{ flex: 1 }}>
            {renderImages()}
            <div className="imageSearchbarPagignationContainer">
              <Stack spacing={1}>
                <Pagination
                  count={pageCount}
                  variant="outlined"
                  size="large"
                  shape="rounded"
                  onChange={handlePageChange}
                  defaultPage={1}
                  page={page}
                  sx={{
                    "& ul > li > button": {
                      margin: 0,
                      backgroundColor: "white",
                    },
                    "& ul > li:not(:first-child):not(:last-child) > button": {
                      borderRadius: 0,
                    },
                    "& ul > li:first-child > button": {
                      borderRadius: "8px 0px 0px 8px",
                    },
                    "& ul > li:last-child > button": {
                      borderRadius: "0px 8px 8px 0px",
                    },
                  }}
                  hidePrevButton={true}
                />
              </Stack>
            </div>
          </div>
        </div>
        <canvas
          id="canvas"
          style={{ display: "none" }}
          width="595"
          height="842"
        ></canvas>
        <Drawer
          anchor="left"
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        // variant="persistent"
        >
          <Box
            sx={{
              width: isMobile ? "100vw" : "40vw",
              height: "100vh",
              display: "flex",
              flex: 1,
              backgroundColor:
                path[0] === "academic"
                  ? "#7da8ff"
                  : path[0] === "earlycarrier"
                    ? "#71af47"
                    : path[0] === "edutainment"
                      ? "#e68900"
                      : path[0] === "printrich"
                        ? "#d351a8"
                        : path[0] === "infohub"
                          ? "#a46ee0"
                          : "#7da8ff",
            }}
          >
            <div className="homeGutter" />
            <div
              style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                alignItems: "center",
                gap: 40,
              }}
            >
              <div className={isMobile ? "mobileActionContainer" : "actionContainer"}>
                {isMobile ?
                  <div className="mobileActionButtons">
                    {isLoggedin ? (
                      <IconButton disableRipple onClick={handlePrint}>
                        <PrintIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        disableRipple
                        onClick={() => {
                          props.openLogin(true);
                        }}
                      >
                        <PrintIcon />
                      </IconButton>
                    )}
                    <IconButton onClick={downloadImage} disableRipple>
                      <SaveToCloudIcon />{" "}
                    </IconButton>
                    <IconButton disabled disableRipple>
                      <AudioIcon color="C0C0C0" />
                    </IconButton>
                    <IconButton disabled={true} disableRipple>
                      <VideoIcon color="C0C0C0" />
                    </IconButton>
                    {selectedItem?.fileType === "pdf" ? (
                      <>
                        <IconButton>
                          <ZoomInIcon
                            onClick={() => zoomRef.current.zoomIn(0.2)}
                            color="black"
                          />
                        </IconButton>
                        <IconButton>
                          <ZoomOutIcon
                            onClick={() => zoomRef.current.zoomOut(0.2)}
                            color="black"
                          />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton>
                          <ZoomInIcon
                            onClick={() => zoomRef.current.zoomIn(0.2)}
                            color="black"
                          />
                        </IconButton>
                        <IconButton>
                          <ZoomOutIcon
                            onClick={() => zoomRef.current.zoomOut(0.2)}
                            color="black"
                          />
                        </IconButton>
                      </>
                    )}
                    <IconButton onClick={() => handleImageNavigation(-1)}
                      disabled={preImgDisabled ? true : false}
                    >
                      <LeftArrowIcon
                        color="black"
                      // color={preImgDisabled ? "c0c0c0" : "black"}
                      />
                    </IconButton>
                    <IconButton onClick={() => handleImageNavigation(1)}
                      disabled={nextImgDisabled ? true : false}
                    >
                      <RightArrowIcon
                        color="black"
                      // color={nextImgDisabled ? "c0c0c0" : "black"}
                      />
                    </IconButton>
                    <IconButton onClick={() => {
                      handleImageResize(null)
                      setPdfPage(1)
                      setPreImgDisabled(false)
                      setNextImgDisabled(false)
                    }}>
                      <CloseIcon color="black" />
                    </IconButton>
                  </div> :
                  <>
                    <div className="actionButtons">
                      {isLoggedin ? (
                        <IconButton disableRipple onClick={handlePrint}>
                          <PrintIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          disableRipple
                          onClick={() => {
                            props.openLogin(true);
                          }}
                        >
                          <PrintIcon />
                        </IconButton>
                      )}
                      <IconButton onClick={downloadImage} disableRipple>
                        <SaveToCloudIcon />{" "}
                      </IconButton>
                      <IconButton disabled disableRipple>
                        <AudioIcon color="C0C0C0" />
                      </IconButton>
                      <IconButton disabled={true} disableRipple>
                        <VideoIcon color="C0C0C0" />
                      </IconButton>
                    </div>
                    <div className="navigationButtons">
                      {selectedItem?.fileType === "pdf" ? (
                        <>
                          <IconButton>
                            <ZoomInIcon
                              onClick={() => zoomRef.current.zoomIn(0.2)}
                              color="black"
                            />
                          </IconButton>
                          <IconButton>
                            <ZoomOutIcon
                              onClick={() => zoomRef.current.zoomOut(0.2)}
                              color="black"
                            />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton>
                            <ZoomInIcon
                              onClick={() => zoomRef.current.zoomIn(0.2)}
                              color="black"
                            />
                          </IconButton>
                          <IconButton>
                            <ZoomOutIcon
                              onClick={() => zoomRef.current.zoomOut(0.2)}
                              color="black"
                            />
                          </IconButton>
                        </>
                      )}
                      <IconButton onClick={() => handleImageNavigation(-1)}
                        disabled={preImgDisabled ? true : false}
                      >
                        <LeftArrowIcon
                          color="black"
                        // color={preImgDisabled ? "c0c0c0" : "black"}
                        />
                      </IconButton>
                      <IconButton onClick={() => handleImageNavigation(1)}
                        disabled={nextImgDisabled ? true : false}
                      >
                        <RightArrowIcon
                          color="black"
                        // color={nextImgDisabled ? "c0c0c0" : "black"}
                        />
                      </IconButton>
                      <IconButton onClick={() => {
                        handleImageResize(null)
                        setPdfPage(1)
                        setPreImgDisabled(false)
                        setNextImgDisabled(false)
                      }}>
                        <CloseIcon color="black" />
                      </IconButton>
                    </div>
                  </>}
              </div>
              {selectedItem?.fileType === "pdf" ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '70vh',
                  width: '100%',
                  gap: '20px'
                }}>
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="#d32f2f">
                    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
                  </svg>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {selectedItem?.tittle || 'PDF Document'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', opacity: 0.9, textAlign: 'center', maxWidth: '300px' }}>
                    Click the button below to view or download this PDF file
                  </Typography>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                    <Button 
                      variant="contained" 
                      sx={{ bgcolor: 'white', color: '#d32f2f', '&:hover': { bgcolor: '#f5f5f5' } }}
                      onClick={() => window.open(selectedItem.url, '_blank')}
                    >
                      Open PDF
                    </Button>
                    <Button 
                      variant="outlined" 
                      sx={{ borderColor: 'white', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                      onClick={downloadImage}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <TransformWrapper ref={zoomRef}>
                  <TransformComponent>
                    <div className="drawerImage">
                      <img
                        ref={printableDiv}
                        alt=""
                        style={{ width: "80%", flex: 0.4 }}
                        src={selectedItem?.url}
                        className="academicImage"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22400%22%20viewBox%3D%220%200%20300%20400%22%3E%3Crect%20fill%3D%22%23f5f5f5%22%20width%3D%22300%22%20height%3D%22400%22%2F%3E%3Ctext%20fill%3D%22%23999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3EImage%20Not%20Found%3C%2Ftext%3E%3C%2Fsvg%3E';
                        }}
                      />
                    </div>
                  </TransformComponent>
                </TransformWrapper>
              )}
              <div className="bottomContainer">
                <Typography style={{ color: "black" }}>
                  {selectedItem?.tittle}
                </Typography>
                {location.pathname === "/auth/images" ? (
                  <Button className="bottomContainerButton" onClick={deleteImage}>
                    Delete Image
                  </Button>
                ) : (
                  <Button
                    className="bottomContainerButton"
                    onClick={() => {
                      props.addToNoSelectImage(selectedItem, addedImage)
                      setAddedImage(addedImage ? false : true)
                      // deleteImage()
                    }}
                  >
                    {(path[0] === "academic" ||
                      path[0] === "result" ||
                      path[0] === "sections") &&
                      addedImage
                      // props.addedImages.findIndex((el) => el.fileName === item?.fileName) >= 0
                      ? "Remove Image"
                      : "Select Image"}
                  </Button>
                )}
              </div>
            </div>
            <div className="homeGutter" />
          </Box>
        </Drawer>
      </div>
    );
  };
  export default ImageRenderer;
