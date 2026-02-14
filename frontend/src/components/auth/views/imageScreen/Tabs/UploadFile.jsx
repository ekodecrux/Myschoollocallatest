import React, { useRef } from "react";
import MSTextField from "../../../../../customTheme/textField/MSTextField";
import { Button, Typography } from "@mui/material";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useDispatch, useSelector } from "react-redux";
import { RefreshToken } from "../../../../../redux/authSlice";
import { userUploadFile } from "../../../../../redux/uploadFileSlice";
import { useSnackbar } from "../../../../../hook/useSnackbar";
// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
const UploadFile = () => {
    const inputRef = useRef();
    const [preview, setPreview] = React.useState();
    const [previewPdf, setPreviewPdf] = React.useState();
    const [selectedFile, setSelectedFile] = React.useState([]);
    const [isFilePicked, setIsFilePicked] = React.useState(false);
    const [numPages, setNumPages] = React.useState(null);
    const [pageNumber, setPageNumber] = React.useState(1);
    const { refreshToken, accessToken, userRole } = useSelector((state) => state.login);
    const dispatch = useDispatch()
    const { displaySnackbar } = useSnackbar()
    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }
    const [fileData, setFileData] = React.useState({
        category: "", tags: "", title: "", file: "", description: ""
    })
    const handleFieldsChange = (e, fieldName) => {
        e.preventDefault()
        setFileData(current => {
            const copy = { ...current }
            copy[fieldName] = e.target.value
            return copy
        })
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate required fields - Issue 28: Prevent blank page on empty submission
        if (!selectedFile) {
            displaySnackbar({ message: 'Please select a file to upload', severity: 'error' });
            return;
        }
        if (!fileData.title || fileData.title.trim() === '') {
            displaySnackbar({ message: 'Please enter an image title', severity: 'error' });
            return;
        }
        if (!fileData.category || fileData.category.trim() === '') {
            displaySnackbar({ message: 'Please enter a category', severity: 'error' });
            return;
        }
        
        let header = {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${accessToken}`
        };
        fileData.file = selectedFile
        let uploadData = JsonToFormData(fileData)
        dispatch(userUploadFile({
            headers: header,
            body: uploadData
        })).then((res) => {
            if (res.payload?.success) {
                displaySnackbar({ message: 'Image submitted for approval. Super Admin will review.', severity: 'success' })
                setFileData({
                    category: "", tags: "", title: "", file: "", description: ""
                })
                setPreview()
                setPreviewPdf()
                setIsFilePicked(false);
            } else if (res.payload?.error || res.payload?.detail) {
                displaySnackbar({ message: res.payload?.error || res.payload?.detail || 'Upload failed', severity: 'error' })
            } else if (res.payload?.status === 401 || res.error) {
                header["Content-Type"] = "application/json"
                dispatch(RefreshToken({
                    headers: header,
                    body: {
                        "refreshToken": refreshToken
                    }
                })).then((res) => {
                    header["Content-Type"] = "multipart/form-data"
                    header["Authorization"] = `Bearer ${res.payload.accessToken}`
                    dispatch(userUploadFile({
                        headers: header,
                        body: uploadData
                    })).then((res) => {
                        if (res.payload?.success) {
                            displaySnackbar({ message: 'Image submitted for approval', severity: 'success' })
                            setFileData({
                                category: "", tags: "", title: "", file: "", description: ""
                            })
                            setPreview()
                            setPreviewPdf()
                            setIsFilePicked(false);
                        } else {
                            displaySnackbar({ message: res.payload?.error || 'Upload failed', severity: 'error' })
                        }
                    })
                })
            }
        })
    };
    // Function to convert JSON to FormData
    // @param json object
    // @return formdata
    const JsonToFormData = (item) => {
        let fd = new FormData()
        for (var key in item) {
            fd.append(key, item[key]);
        }
        return fd
    }
    return (
        <div className="myImageUploadImageContainer">
            <div className="myImageEnterTextFieldContainer">
                <MSTextField id="title" type="text" placeholder="Enter image title"
                    label="* Image Title" fieldName="title"
                    value={fileData.title}
                    onChange={handleFieldsChange}
                />
                <MSTextField id="category" type="text" placeholder="Enter category (e.g., ANIMALS, NATURE)"
                    label="* Category" fieldName="category" value={fileData.category}
                    onChange={handleFieldsChange}
                />
                <MSTextField id="description" type="text" placeholder="Enter description (optional)"
                    label="Description" fieldName="description" value={fileData.description}
                    onChange={handleFieldsChange}
                />
                <MSTextField id="tags" type="text" placeholder="Enter tags separated by comma"
                    label="Tags" fieldName="tags" value={fileData.tags}
                    onChange={handleFieldsChange}
                />
                <div className="myImagefileUploadContainer">
                    <Typography fontSize="14px" fontWeight="700">* Select Image File</Typography>
                    <div className="myImageChooseFileContainer">
                        <label htmlFor="file" className="myImageChooseFile">
                            <Typography fontSize="14px">Choose File</Typography>
                            <input
                                id="file"
                                ref={inputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    setSelectedFile(e.target.files[0]);
                                    setIsFilePicked(true);
                                    var objectUrl = window.URL.createObjectURL(e.target.files[0])
                                    setPreview(objectUrl);
                                    setPreviewPdf(objectUrl);
                                }}
                                onClick={(e) => { e.target.value = "" }}
                            />
                        </label>
                        {isFilePicked ? selectedFile.name : null}
                    </div>
                </div>
            </div>
            <div className="myImagePreviewContainer">
                <Typography style={{ alignItems: 'center', fontSize: '20px' }}>Preview</Typography>
                {preview ? <div><img src={preview} style={{ maxWidth: '240px' }} alt="Preview" /></div> :
                    <div className="myImagePreviewImageContainer">
                        <Typography style={{ alignItems: 'center' }}>No File Selected </Typography>
                    </div>}
                {selectedFile.type === "application/pdf" ?
                    <Document file={previewPdf}
                        onLoadSuccess={onDocumentLoadSuccess}>
                        <Page maxWidth={200} height={200} pageNumber={pageNumber} />
                    </Document> : null}
                <div className="myImageSaveBtn">
                    <Button disableElevation className='paymentProceedBtn' variant='contained' onClick={handleSubmit}>Submit for Approval</Button>
                </div>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Note: Submitted images will be reviewed by Super Admin before being added to the library.
                </Typography>
            </div>
        </div>
    )
}
export default UploadFile;