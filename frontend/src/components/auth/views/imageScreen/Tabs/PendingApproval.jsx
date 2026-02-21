import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ReactComponent as Crossicon } from "../../../../../assests/homeScreen/crossicon.svg";
import { pendingApproval } from "../../../../../redux/pendingApprovalSlice";
import { RefreshToken } from "../../../../../redux/authSlice";
import { Box, Modal, Typography, Button, Card } from '@mui/material';
// import { ApproveFile } from '../../../../../redux/approveFileSlice';
import MSTextField from '../../../../../customTheme/textField/MSTextField';
import { isMobile } from 'react-device-detect';
const PendingApproval = (props) => {
    // const { images, hasMore, loading } = useSelector((state) => state.imagesData)
    const { refreshToken, accessToken, userRole } = useSelector((state) => state.login);
    const { loading } = useSelector((state) => state.pendingImageApproval)
    const [selectedItem, setSelectedItem] = React.useState(null);
    const [pendingImages, setPendingImages] = React.useState([]);
    const [open, setOpen] = React.useState(false);
    const [rejectReason, setRejectReason] = React.useState('');
    const dispatch = useDispatch();
    const handleClose = () => {
        setOpen(false);
        setRejectReason('');
    }
    React.useEffect(() => {
        let header = {
            "Content-Type": "application/json",
            // 'Accept': 'application/json',
            "Authorization": `Bearer ${accessToken}`
        }
        // Check for admin roles
        if (userRole === "ADMIN" || userRole === "SCHOOL_ADMIN" || userRole === "SUPER_ADMIN") {
            dispatch(pendingApproval({
                headers: header,
                method: 'GET',
                body: {
                    limit: 10,
                    // lastS3Key: ''
                }
            })).then((res) => {
                // Handle the response safely
                if (res.payload && Array.isArray(res.payload)) {
                    setPendingImages(res.payload);
                } else if (res.payload && res.payload.pendingImages && Array.isArray(res.payload.pendingImages)) {
                    setPendingImages(res.payload.pendingImages);
                } else {
                    setPendingImages([]);
                }
            }).catch((err) => {
                console.error('Error fetching pending approvals:', err);
                setPendingImages([]);
            });
        }
    }, [accessToken, userRole, dispatch])
    const handleImageOpen = (item) => {
        setOpen(true);
        setSelectedItem(item);
    }
    const handleFieldsChange = (e, fieldName) => {
        e.preventDefault()
        setSelectedItem(current => {
            const copy = { ...current }
            copy[fieldName] = e.target.value
            return copy
        })
        setRejectReason(e.target.value);
    }
    const handleFileApprove = (e) => {
        e.preventDefault();
        // setSelectedItem(item);
        // let header = {
        //     "Content-Type": "application/json",
        //     // 'Accept': 'application/json',
        //     "Authorization": `Bearer ${accessToken}`
        // }
        // dispatch(ApproveFile({
        //     headers: header,
        //     method: 'GET',
        //     params: {
        //         category: '',
        //         menu: '',
        //         sumMenu: '',
        //         subjects: '',
        //         sections: '',
        //         subSections: '',
        //         unit: '',
        //         adminCode: '',
        //         metaName: '',
        //         type: '',
        //         pendingApprovalS3Path: '',
        //         s3Path: ''
        //     }
        // }))
    }
    const renderPendingImages = () => {
        // Ensure pendingImages is always an array
        const images = Array.isArray(pendingImages) ? pendingImages : [];
        if (images.length === 0 && !loading)
            return <p>No Pending Images Found...</p>
        else if (images.length === 0 && loading)
            return <p>Loading...</p>
        else {
            return (
                <div className="pendingImageContainer" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px',
                    justifyContent: isMobile ? 'space-evenly' : 'unset' }}>
                    {images.map((k, i) => {
                        return (
                            <div key={i} className="pendingImageSubContainer" style={{ display: 'flex', flexDirection: 'column', 
                                    maxWidth: isMobile ? '40%' : 'unset', cursor: 'pointer' }}
                                onClick={() => handleImageOpen({
                                    url: k.url,
                                    fileName: k.pendingApproval?.fileName || k.fileName || 'Unknown',
                                    category: k.pendingApproval?.category || k.category || '',
                                    metaTags: k.pendingApproval?.metaTags || k.metaTags || '',
                                    s3Path: k.pendingApproval?.s3Path || k.s3Path || ''
                                })}>
                                <img src={k.url} alt="Image not available" width={150} height={200} />
                                <p>{k.title || k.pendingApproval?.title || k.pendingApproval?.fileName || k.fileName || k.original_filename || 'No Name'}</p>
                            </div>
                        )
                    })}
                </div>
            )
        }
    }
    return (
        <div className="pendingImages">
            {renderPendingImages()}
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <div className="pendingImageOpen" style={{
                    display: 'flex', flexDirection: isMobile ? 'column' : 'row-reverse', flex: '0.7',
                    gap: '30px', maxWidth: '690px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                        <div style={{
                            display: 'flex', backgroundColor: 'white', width: '40px', height: '40px', borderRadius: '30px',
                            cursor: 'pointer', alignItems: 'center', justifyContent: 'center'
                        }}
                        onClick={handleClose}>
                            <Crossicon />
                        </div>
                    </div>
                    <Card className="pendingApprovalModalContainer" style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        flex: 1, padding: '30px', maxHeight: '80vh', overflowY: 'scroll',
                        gap: '50px'
                    }}>
                        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '6%' }}>
                            <div className="loginTextFieldContainer" style={{ alignItems: 'normal' }}>
                                <MSTextField id="filename" type="text" placeholder="Enter file name"
                                    label="* File Name" fieldName="fileName"
                                    // value={isFilePicked ? selectedFile.name : null}
                                    value={selectedItem?.fileName}
                                    onChange={handleFieldsChange}
                                />
                                <MSTextField id="metaTags" type="text" placeholder="Enter meta tags seperated by comma"
                                    label="* Meta Tags" fieldName="metaTags" value={selectedItem?.metaTags}
                                    onChange={handleFieldsChange}
                                />
                                <MSTextField id="s3Path" type="text" placeholder="Enter meta tags seperated by comma"
                                    label="* S3 Path" fieldName="s3Path" value={selectedItem?.s3Path}
                                    onChange={handleFieldsChange}
                                />
                            </div>
                            <div className='pendingImageReject' style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: '5%',
                                     rowGap: isMobile ? 10 : 'unset', padding: isMobile ? 15 : 'unset'}}>
                                <div className='pendingImageRejectBtn' style={{ display: 'flex', alignItems: 'end' }}>
                                    <Button
                                        className='rejectBtn'
                                        variant="contained"
                                        color="error"
                                        onClick={rejectReason.length > 0 ? handleFileApprove : undefined}
                                        disabled={rejectReason.length === 0}
                                    >
                                        Reject
                                    </Button>
                                </div>
                                <MSTextField id="rejection" type="text" placeholder="Reason of Rejection"
                                    label="Reason of Rejection" fieldName="" value={rejectReason}
                                    onChange={handleFieldsChange}
                                />
                            </div>
                        </div>
                        <div>
                            <div style={{display: isMobile ?  'flex' : 'unset', justifyContent: isMobile ? 'center' : 'unset'}}>
                                <img src={selectedItem?.url} alt="" width={200} height={300} />
                            </div>
                            <div className="approveBtn" style={{
                                paddingTop: '3%', display: 'flex',
                                justifyContent: 'center'
                            }}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={rejectReason.length === 0 ? handleFileApprove : undefined}
                                    disabled={rejectReason.length > 0}
                                >
                                    Approve
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </Modal>
        </div>
    )
}
export default PendingApproval;