import React, { useEffect } from 'react'
import TopNavbar from './navbar/TopNavbar'
import "./AuthStyle.css"
import SideNav from './navbar/SideNav'
import { Outlet } from 'react-router-dom'
import { isMobile, MobileView } from 'react-device-detect'
import MobileNavbar from './mobileNavbar/MobileNavbar'
import { useDispatch, useSelector } from 'react-redux'
import { MyProfile } from '../../../redux/myProfileSlice'
import { RefreshToken } from '../../../redux/authSlice'

const AuthViews = () => {
    const [mounted, setMounted] = React.useState(isMobile ? false : true);
    const dispatch = useDispatch();
    const { accessToken, refreshToken } = useSelector((state) => state.login);
    const { userDetails } = useSelector((state) => state.myProfile);

    // Fetch user details on mount to display name and role
    useEffect(() => {
        if (accessToken && !userDetails?.name) {
            const header = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            };
            dispatch(MyProfile({
                headers: header,
                method: "GET",
                body: {}
            })).then((res) => {
                if (res.payload?.message === "Expired JWT") {
                    dispatch(RefreshToken({
                        headers: header,
                        body: { "refreshToken": refreshToken }
                    })).then((refreshRes) => {
                        if (refreshRes.payload?.accessToken) {
                            const newHeader = {
                                ...header,
                                "Authorization": `Bearer ${refreshRes.payload.accessToken}`
                            };
                            dispatch(MyProfile({
                                headers: newHeader,
                                method: "GET",
                                body: {}
                            }));
                        }
                    });
                }
            });
        }
    }, [accessToken, dispatch, refreshToken, userDetails?.name]);

    return (
        <div className='authViewContainer'>
            <TopNavbar toggleDrawer={() => setMounted(mounted ? false : true)} />
            <MobileView>
                <MobileNavbar toggleDrawer={() => setMounted(!mounted ? true : false)} />
            </MobileView>
            <div className='authViewMain' style={{display:mounted ? 'flex' : 'block'}}>
                <SideNav drawerState={mounted} toggleDrawer={() => setMounted(mounted ? false : true)}/>
                <Outlet />
            </div>
        </div>
    )
}
export default AuthViews