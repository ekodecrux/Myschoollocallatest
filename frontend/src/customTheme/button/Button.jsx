import { Button, IconButton } from '@mui/material';
import React from 'react'
import { useNavigate } from 'react-router-dom';
// import   crossicon  from '../../assests/homeScreen/crossicon.svg';
import { ReactComponent as Crossicon } from '../../assests/homeScreen/crossicon.svg';
const Btn = () => {
  const navigate = useNavigate();
  function previouspage() {
    navigate(-1);
  }
  return (
    <>
      <IconButton onClick={previouspage}
        color="primary" aria-label="add to shopping cart"
        style={{ backgroundColor: '#FFFFFF', border: '2px solid #B3DAFF', borderRadius: '8px', opacity: '1', height: '35px', width: '52px' }}>
        <Crossicon />
      </IconButton>
    </>
  )
}
export default Btn;