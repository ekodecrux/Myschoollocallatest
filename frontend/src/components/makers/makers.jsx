import React from 'react'
import { Outlet } from 'react-router-dom'
const Makers = React.forwardRef((props, ref) => {
    return (
        <Outlet ref={ref}/>
    )
})
export default Makers