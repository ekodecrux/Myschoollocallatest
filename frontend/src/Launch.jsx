import React from 'react'
import LaunchImage from './assests/la.png'
import './Launch.css'
const Launch = () => {
    return (
        <div style={{maxWidth: "100vw", maxHeight: "100vh", width: "100vw", display:'flex'}}>
            <img src={LaunchImage} width={"100%"} />
            <a href='/'
                className='launchBtn' style={{position:'absolute', 
                width: 400,
                backgroundColor: '#9D0B0D',
                color:'#FEC22C',
                display:'flex',
                borderRadius:10,
                cursor:'pointer',
                fontWeight: 'bold',
                justifyContent:'center',
                alignItems:'center',
                height:60,
                left:"40%", bottom:"10%"}}>!! Launch !!</a>
        </div>
    )
}
export default Launch