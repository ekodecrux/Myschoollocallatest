import React from 'react'
import { TextField, InputAdornment } from '@mui/material'
import { ReactComponent as SearchIcon } from '../../assests/search.svg'
const AuthSearchField = (props) => {
    return (
        <TextField size='small'
            sx={{
                '.MuiOutlinedInput-root' : {
                    fontFamily : 'Proxima Nova !important',
                    fontSize: "16px !important",
                    color:"#707070 !important",
                    background : "white",
                    borderRadius : "8px !important"
                }
            }}
            type={props.type} id={props.id}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start" >
                        <SearchIcon  />
                    </InputAdornment>
                )
            }}
            fullWidth placeholder={props.placeholder} onChange={props.onChange} />
    )
}
export default AuthSearchField