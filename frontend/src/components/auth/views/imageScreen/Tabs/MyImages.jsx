import React from 'react';
import ImageRenderer from "../../imageRenderer/ImageRenderer";
import { useDispatch, useSelector } from "react-redux";
import { GetMyImages } from "../../../../../redux/addImagesSlice";
import { RefreshToken } from "../../../../../redux/authSlice";
const MyImages = () => {
  const { images, hasMore, loading } = useSelector((state) => state.imagesData)
  const { refreshToken, accessToken, userRole } = useSelector((state) => state.login);
  const dispatch = useDispatch();
  const getMyImages = () => {
    let header = {
      "Content-Type": "application/json",
      // 'Accept': 'application/json',
      "Authorization": `Bearer ${accessToken}`
    }
    if (userRole !== "ADMIN") {
      dispatch(GetMyImages({
        headers: header,
        method: "GET",
        body: {
          limit: 100
        }
      })).then((res) => {
        if (res.payload.message === "Expired JWT") {
          dispatch(RefreshToken({
            headers: header,
            body: {
              "refreshToken": refreshToken
            }
          })).then((res) => {
            header["Authorization"] = `Bearer ${res.payload.accessToken}`
            dispatch(GetMyImages({
              headers: header,
              method: "GET",
              body: {
                limit: 100
              }
            }))
          })
        }
      })
    }
  }
  React.useEffect(() => getMyImages(), [])
  return (
    <ImageRenderer
      // openLogin={setOpen}
      place={"MyImages"}
      data={images}
      loading={loading}
      getMyImages={getMyImages}
    // token={continuationToken}
    // addedImages={noSelectImage}
    // addToNoSelectImage={selectPicture} 
    />
  )
}
export default MyImages;