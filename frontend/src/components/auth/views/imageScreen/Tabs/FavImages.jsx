import React from 'react';
import ImageRenderer from "../../imageRenderer/ImageRenderer";
import { useDispatch, useSelector } from "react-redux";
import { RefreshToken } from "../../../../../redux/authSlice";
import { GetFavImages } from "../../../../../redux/addImagesSlice";
const FavImages = () => {
  const { images, hasMore, loading } = useSelector((state) => state.imagesData)
  const { refreshToken, accessToken, userRole } = useSelector((state) => state.login);
  const [favImage, setFavImage] = React.useState([]);
  const dispatch = useDispatch();
  const getFavImages = () => {
    let header = {
      "Content-Type": "application/json",
      // 'Accept': 'application/json',
      "Authorization": `Bearer ${accessToken}`
    }
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      dispatch(GetFavImages({
        headers: header,
        method: "GET",
        body: {
          limit: 100
        }
      })).then((res) => {
        // Handle response - images can be in payload.images or payload directly
        if (res.payload) {
          if (res.payload.images) {
            setFavImage(res.payload.images)
          } else if (Array.isArray(res.payload)) {
            setFavImage(res.payload)
          } else {
            setFavImage([])
          }
        }
        if (res.payload?.message === "Expired JWT") {
          dispatch(RefreshToken({
            headers: header,
            body: {
              "refreshToken": refreshToken
            }
          })).then((res) => {
            header["Authorization"] = `Bearer ${res.payload.accessToken}`
            dispatch(GetFavImages({
              headers: header,
              method: "GET",
              body: {
                limit: 100
              }
            })).then((res) => {
              if (res.payload?.images) {
                setFavImage(res.payload.images)
              }
            })
          })
        }
      }).catch((err) => {
        console.error("Error fetching favourite images:", err)
        setFavImage([])
      })
    }
  }
  React.useEffect(() => getFavImages(), [accessToken])
  return (
    <ImageRenderer
      // openLogin={setOpen}
      place={"MyImages"}
      loading={loading}
      data={favImage}
      getFavImages={getFavImages}
    // token={continuationToken}
    // addedImages={noSelectImage}
    // addToNoSelectImage={selectPicture}
    />
  )
}
export default FavImages;