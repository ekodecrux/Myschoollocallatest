import { Typography } from '@mui/material'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RefreshToken } from '../../../redux/authSlice'
import { useLocation, useNavigate } from 'react-router-dom';
const Authorize = () => {
    const { refreshToken, accessToken } = useSelector((state) => state.login);
    const dispatch = useDispatch()
    const location = useLocation()
    const navigate = useNavigate()
    var refresh_Token = location.search.split('=')[1]
    React.useEffect(() => {
        dispatch(RefreshToken({
            // headers: header,
            appType : "MobileApp",
            body: {
                "refreshToken": refresh_Token
            }
        }))
    }, [])
    React.useEffect(() => {
        if (accessToken && refreshToken) {
            navigate('/auth')
        }
    }, [accessToken, refreshToken])
    return (
        <>
            <Typography variant='h1'>
                You have been redirecting to Dashboard...
            </Typography>
        </>
    )
}
export default Authorize