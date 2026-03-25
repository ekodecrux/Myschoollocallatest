import { Typography, Box, Button, Modal, Drawer, IconButton } from '@mui/material';
import React, { useState } from 'react';
import Cursor from "../../../assests/homeScreen/Cursor.png";
import { ReactComponent as EmptyImage } from "../../../assests/emptyImage.svg";
import { ReactComponent as PrintIcon } from '../../../assests/actionIcons/printIcon.svg'
import { ReactComponent as SaveToCloudIcon } from '../../../assests/actionIcons/cloudSave.svg'
import { ReactComponent as FavIcon } from '../../../assests/actionIcons/favIcon.svg'
import { ReactComponent as FavIconFilled } from '../../../assests/actionIcons/favIconFIlled.svg'
import { ReactComponent as CloseIcon } from "../../../assests/closeIcon.svg";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import './selectImage.css';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from '../../../hook/useSnackbar';
import { SaveMyImages } from '../../../redux/addImagesSlice';
import { RefreshToken } from "../../../redux/authSlice";
import { Navigate, useNavigate } from 'react-router-dom';
import { Login } from '../../auth/login/Login';
import { SignUp } from '../../auth/signUp/SignUp';
import { isMobile } from 'react-device-detect';
import { useCredits } from '../../../hook/useCredits';

// Helper to check if file is PDF
const isPdfFile = (item) => {
  const fileName = item?.fileName || item?.url || '';
  return fileName.toLowerCase().endsWith('.pdf') || item?.fileType === 'pdf';
};

// Helper to get display image URL (thumbnail for PDFs, regular URL for images)
const getDisplayImageUrl = (item) => {
  // First check if thumbnailUrl is available
  if (item?.thumbnailUrl) {
    return item.thumbnailUrl;
  }
  // For non-PDFs, use the regular URL
  if (!isPdfFile(item)) {
    return item?.url;
  }
  // For PDFs without thumbnail, generate one from backend
  if (item?.url) {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const encodedUrl = encodeURIComponent(item.url);
    return `${backendUrl}/api/rest/images/pdf-thumbnail?url=${encodedUrl}&width=120&height=120`;
  }
  return null;
};

// Component to display thumbnail with error handling
const SelectedImageThumbnail = ({ displayUrl, isPdf, fallbackUrl, title }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError || !displayUrl) {
    if (isPdf) {
      return (
        <div style={{ 
          width: '100%', 
          height: '120px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#fff5f5',
          borderRadius: '8px',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <PictureAsPdfIcon style={{ fontSize: 50, color: '#E53935' }} />
          <span style={{ fontSize: '10px', color: '#E53935', fontWeight: 'bold' }}>PDF</span>
        </div>
      );
    }
    return <img src={fallbackUrl} alt={title || ''} onError={(e) => { e.target.style.display = 'none'; }} />;
  }
  
  return (
    <img 
      src={displayUrl} 
      alt={title || ''} 
      onError={() => setHasError(true)}
      style={{ maxHeight: '120px', objectFit: 'cover' }}
    />
  );
};

const Checkbox = (props) => {
  const [isHovering, setIsHovering] = useState(false);
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = useState(0)
  const { refreshToken, accessToken, tokenExpiry, userRole, isLoggedin } = useSelector((state) => state.login);
  const navigate=useNavigate();
  const dispatch = useDispatch()
  const { displaySnackbar } = useSnackbar()
  const { useCredits: deductCredits, loading: creditsLoading } = useCredits();
  const handleClose = () => {
    setOpen(false);
  };
  const handleMouseOver = () => {
    setIsHovering(true);
  };
  const handleMouseOut = () => {
    setIsHovering(false);
  };
  const selectedImageRenderer = () => {
    return (
      <div className="showSelectedImageContainer">
        {props.image.map((showSelectedImage, index) => {
          const displayUrl = getDisplayImageUrl(showSelectedImage);
          const isPdf = isPdfFile(showSelectedImage);
          return (
            <div className='selectedImageSubContainer' key={index}>
              <SelectedImageThumbnail 
                displayUrl={displayUrl}
                isPdf={isPdf}
                fallbackUrl={showSelectedImage.url}
                title={showSelectedImage.tittle}
              />
              <Typography fontSize="16px" color="black">
                {showSelectedImage.tittle}
              </Typography>
              <div className='overlaysFavIconContainer'>
                <IconButton
                  onClick={() => props.handleAddToFavourite(showSelectedImage)}
                  style={{ backgroundColor: 'white', border: '1px solid #DDDDDD' }}>
                  {showSelectedImage?.markFav ? <FavIconFilled /> : <FavIcon />}
                </IconButton>
              </div>
              <div className='overlaysActionBtn'>
                <Button variant='text' size='small' color='secondary' onClick={() => props.handleRemove(showSelectedImage, true)}>Remove</Button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  const handleSaveToMyImages = async () => {
    if (isLoggedin) {
      let data = props.image
      var favData = []
      var myImagesData = []
      data.map((k, i) => {
        if (k?.markFav) {
          favData.push(k.fileName)
        } else {
          myImagesData.push(k.fileName)
        }
      })
      
      // Calculate total images to save
      const totalImages = favData.length + myImagesData.length;
      if (totalImages === 0) {
        displaySnackbar({ message: "No images selected to save" });
        return;
      }
      
      // Deduct credits (1 credit per image)
      const creditResult = await deductCredits(totalImages, 'save');
      if (!creditResult.success) {
        // Credit deduction failed - user doesn't have enough credits
        return;
      }
      
      let header = {
        "Content-Type": "application/json",
        // 'Accept': 'application/json',
        "Authorization": `Bearer ${accessToken}`
      }
      if(favData.length !== 0 && myImagesData.length !== 0) {
        let data1 = {
          images: favData,
          markFavourite: true
        }
        let data2 = {
          images: myImagesData,
          markFavourite: false
        }
        dispatch(SaveMyImages({
          headers: header,
          body: data1
        }))
        dispatch(SaveMyImages({
          headers: header,
          body: data2
        })).then((res) => {
          // Response handled - check both string and object responses
          if (res.payload === "Success" || res.payload?.message === "Success") {
            displaySnackbar({ message: "Images saved to My Images" })
            props.handleRemoveAll()
          }
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
                body: data1
              }))
              dispatch(SaveMyImages({
                headers: header,
                body: data2
              })).then((res) => {
                // Response handled
                if (res.payload === "Success" || res.payload?.message === "Success") {
                  displaySnackbar({ message: "Images saved to My Images" })
                  props.handleRemoveAll()
                }
              })
            })
          }
        })
      }
      else if (favData.length !== 0) {
        let data = {
          images: favData,
          markFavourite: true
        }
        dispatch(SaveMyImages({
          headers: header,
          body: data
        })).then((res) => {
          // // Response handled
          if (res.payload === "Success" || res.payload?.message === "Success") {
            displaySnackbar({ message: "Images saved to My Images" })
            props.handleRemoveAll()
          }
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
              })).then((res) => {
                // // Response handled
                if (res.payload === "Success" || res.payload?.message === "Success") {
                  displaySnackbar({ message: "Images saved to My Images" })
                  props.handleRemoveAll()
                }
              })
            })
          }
        })
      } else if (myImagesData.length !== 0) {
        let data = {
          images: myImagesData,
          markFavourite: false
        }
        dispatch(SaveMyImages({
          headers: header,
          body: data
        })).then((res) => {
          // // Response handled;
          if (res.payload === "Success" || res.payload?.message === "Success") {
            displaySnackbar({ message: "Images saved to My Images" })
            props.handleRemoveAll()
          }
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
              })).then((res) => {
                if (res.payload === "Success" || res.payload?.message === "Success") {
                  displaySnackbar({ message: "Images saved to My Images" })
                  props.handleRemoveAll()
                }
              })
            })
          }
        })
      }
    } else {
      displaySnackbar({ message: "Please log in first to perform this Actions." })
      props.openLogin(true)
      setOpen(false)
      return
    }
  }
  const myImagenavigate=()=>{
    if (isLoggedin) {
      navigate('/auth/images')
    }
    else {
      displaySnackbar({ message: "Please log in first to perform this Actions." })
      props.openLogin(true)
      setOpen(false)
      return
    }
  }
  return (
    <>
      <div onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} className="selectedImageContainer" onClick={() => setOpen(true)}>
        <img src={Cursor} alt="Selected items cursor" />
        {isHovering && <Typography fontSize='15px' style={{ color: 'black', fontSize: '15px' }}>You Have Selected  {props.image.length} items</Typography>}
      </div>
      <Drawer
        anchor='right'
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{
          width: isMobile ? '100vw' : '400px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div className="selectImageHeaderContainer">
            <div className='txtContainer'>
              <Typography id="modal-modal-title" variant="h6" style={{ flex: 1 }}>
                {props.image.length} IMAGES SELECTED
              </Typography>
              <div className="iconsContainer">
                {/* {props.image.length !== 0 ? <PrintIcon /> : null} */}
                <CloseIcon color='black' onClick={handleClose} />
              </div>
            </div>
            {props.image.length !== 0 ? <div className="removeButtonContainer">
              <Button variant="text" size='small' onClick={props.handleRemoveAll} sx={{ color: '#7FAAFF' }}>Remove All</Button>
            </div> : null}
          </div>
          {props.image.length === 0 ?
            <div className="emptyImageContainer">
              <EmptyImage />
              <Typography fontSize="16px" color="#707070">
                YOU HAVE SELECTED NO IMAGE!
              </Typography>
            </div> : selectedImageRenderer()}
          <div className="bottomButtonContainer">
            {props.image.length === 0 ?
              <Button className='btnLinearGrad-1' variant="contained" onClick={myImagenavigate}>VIEW ALL IMAGES</Button> :
              <Button className='btnLinearGrad-1' variant="contained" onClick={handleSaveToMyImages}>SAVE TO MY IMAGES</Button>
            }
          </div>
        </Box>
      </Drawer>
    </>
  )
}
export default Checkbox;