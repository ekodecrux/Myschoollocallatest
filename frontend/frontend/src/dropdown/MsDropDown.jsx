import React from 'react'
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
const MsDropDown = (props) => {
    const [age, setAge] = React.useState('');
    // const [age, setAge] = React.useState('');
        const handleChange = (event) => {
          setAge(event.target.value);
        };
    return (
        <div style={{
            display : 'flex',
            flex : 1,
            width : "100%",
            flexDirection : 'column'
        }}>
            <label htmlFor={props.id}>{props.label}</label>
            <FormControl fullWidth>
        <InputLabel id="select-label">{props.placeholder}</InputLabel>
        <Select
        //   labelId="select-label"
        //   value={age}
        //   label="Age"
          onChange={handleChange}
          type={props.type} id={props.id} fullWidth placeholder={props.placeholder}
        >
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
        </div>
    )
}
export default MsDropDown;