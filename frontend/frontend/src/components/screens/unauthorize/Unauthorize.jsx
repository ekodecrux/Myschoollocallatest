import { Typography } from '@mui/material'
import React from 'react'
const Unauthorize = () => {
    return (
        <>
            <Typography variant='h3'>
                This Action is not authorized.
            </Typography>
            <Typography variant='caption'>
                You have been logout. Close the unauthorize action, site will redirect back to home page.
            </Typography>
            <Typography variant='caption'>
                Sorry for the inconvenience caused. Thank you for your understanding!!
            </Typography>
        </>
    )
}
export default Unauthorize