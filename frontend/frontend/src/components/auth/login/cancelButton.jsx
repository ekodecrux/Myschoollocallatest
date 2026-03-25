import { Button, IconButton } from '@mui/material';
import React from 'react'
import { useNavigate } from 'react-router-dom';
import { ReactComponent as Crossicon } from '../../../assests/homeScreen/crossicon.svg';
import './Cancelstyle.css';
const Cancellbtn = (props) => {
  return (
    <>
      <IconButton className='loginSignupCancelModal' style={{ backgroundColor: 'whitesmoke' }}>
        <Crossicon />
      </IconButton>
    </>
  )
}
export default Cancellbtn;