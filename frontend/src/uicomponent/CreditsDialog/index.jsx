import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, Alert } from '@mui/material'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import MSTextField from '../../customTheme/textField/MSTextField'
import { UserCredits } from '../../redux/fetchUsersSlice'
import { useSnackbar } from "../../hook/useSnackbar";
import { isMobile } from 'react-device-detect'
import  Crossicon from "../../assests/homeScreen/crossicon.svg";
export default function CreditDialog(props) {
    const [credits, setCredits] = React.useState('')
    const [error, setError] = React.useState('')
    const [chips, setChips] = React.useState([
        { label: '100', value: 100 }, { label: '500', value: 500 }, { label: '1000', value: 1000 },
        { label: '1500', value: 1500 }, { label: '5000', value: 5000 }, { label: '10000', value: 10000 },
    ])
    const [selectedChip, setSelectedChip] = React.useState(null)
    const dispatch = useDispatch()
    const { displaySnackbar } = useSnackbar();
    const { accessToken, refreshToken, tokenExpiry, userRole } = useSelector((state) => state.login)
    
    // Get current user credits from props
    const currentCredits = props.params?.row?.credits || 0;
    
    // Handle credit input - only allow positive integers
    const handleCreditsChange = (e) => {
        const value = e.target.value;
        // Only allow digits (positive integers)
        if (value === '' || /^[0-9]+$/.test(value)) {
            setCredits(value);
            setError('');
        }
    };
    
    // action: "add" for adding credits, "remove" for removing credits
    const handleAction = (isRemove) => {
        const creditValue = parseInt(credits) || 0;
        
        // Validation: must be greater than 0
        if (creditValue <= 0) {
            setError('Please enter a valid credit amount greater than 0');
            displaySnackbar({ message: 'Please enter a valid credit amount greater than 0' });
            return;
        }
        
        // If removing, check if user has enough credits
        if (isRemove && creditValue > currentCredits) {
            setError(`User only has ${currentCredits} credits. Please enter ${currentCredits} or less.`);
            displaySnackbar({ message: `User only has ${currentCredits} credits. Please enter ${currentCredits} or less.` });
            return;
        }
        
        setError('');
        
        let data = {
            userId: props.params.row.userId,
            credits: creditValue,
            action: isRemove ? "remove" : "add"
        }
        
        let header = {
            "Content-Type": "application/json",
            'Accept': 'application/json',
            "Authorization": `Bearer ${accessToken}`
        }
        dispatch(UserCredits({
            headers : header,
            body : data
        })).then((res) => {
            if (res.payload?.success === false) {
                displaySnackbar({ message: res.payload?.message || 'Operation failed' });
            } else {
                props.params.row?.handleFetchUserData()
                const actionWord = isRemove ? 'removed from' : 'added to';
                displaySnackbar({ message: `${creditValue} credits ${actionWord} user successfully` })
                setCredits('');
                props.handleClose();
            }
        }).catch((err) => {
            displaySnackbar({ message: 'Failed to update credits' });
        })
    }
    return (
        <>
          {/* <Crossicon   className='loginCloseModal'/>   */}
        <Dialog open={props.open} onClose={props.handleClose} PaperProps={{
            style: {
                width: '50vw',
            }
        }}>
         <div className='closeCreditModal' style={{display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'flex-end'}}>
             <img src={Crossicon}  onClick={() => props.handleClose()}/>
            </div>
            <DialogTitle >Manage Image Credits 
            {/* <div className='closeCreditModal' style={{display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'flex-end'}}>
             <img src={Crossicon}  onClick={() => props.handleClose()}/>
            </div> */}
             </DialogTitle>
            <DialogContent style={{cursor:'pointer'}}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Current Credits: <strong>{currentCredits}</strong>
                </Alert>
                
                <MSTextField
                    id="credits" 
                    type="text" 
                    placeholder="Enter number of credits (positive integers only)" 
                    value={credits}
                    label="* Credits" 
                    onChange={handleCreditsChange} 
                    fieldName="credits"
                    inputProps={{ 
                        pattern: "[0-9]*",
                        inputMode: "numeric"
                    }}
                />
                
                {error && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                        {error}
                    </Alert>
                )}
                
                <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap' }}>
                    {chips.map((k, i) => <div key={i} onClick={() => {
                        setSelectedChip(k.value)
                        setCredits(k.value.toString())
                        setError('')
                    }}
                        style={{
                            padding: 5,
                            border: selectedChip === k.value ? '2px solid #1976d2' : '1px solid #B3DAFF',
                            borderRadius: 20,
                            minWidth: 50,
                            backgroundColor: selectedChip === k.value ? '#e3f2fd' : 'white',
                            cursor: 'pointer'
                        }}>
                        <Typography textAlign={'center'}>{k.label}</Typography>
                    </div>)}
                </div>
            </DialogContent>
            <DialogActions>
                <Button fullWidth
                    onClick={() => handleAction(false)}
                    sx={{
                        ':hover': {
                            border: '2px solid #4caf50 !important',
                            backgroundColor: '#e8f5e9 !important'
                        }
                    }}
                    style={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        borderRadius: '8px'
                    }}>Add Credits</Button>
                <Button fullWidth
                    onClick={() => handleAction(true)}
                    sx={{
                        ':hover': {
                            border: '2px solid #f44336 !important',
                            backgroundColor: '#ffebee !important'
                        }
                    }}
                    style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        borderRadius: '8px'
                    }}>Remove Credits</Button>
            </DialogActions>
        </Dialog>
        </>
    )
}