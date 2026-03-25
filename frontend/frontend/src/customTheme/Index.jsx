import {createTheme} from '@mui/material/styles'
export const CustomTheme = createTheme({
    palette : {
        primary : {
            main : "#000000",
        },
        secondary : {
            main : "#7BA6FB",
        },
        tertiary : {
            main : '#FFFFFF',
            light : '#FFFFFF',
            dark : '#FFFFFF',
            contrastText: 'rgba(1, 1, 0, 0.87)'
        }
    },
    components : {
        MuiButton : {
            styleOverrides : {
                root : {
                    "&:hover" : {
                        backgroundColor : "transparent"
                    },
                    fontFamily : "Nunito Sans",
                    textTransform : "capitalize",
                    fontSize : 16,
                    fontWeight : 600,
                }
            }
        },
        MuiTextField : {
            styleOverrides : {
                root : {
                    "& .MuiOutlinedInput-root" : {
                        "&:hover fieldset" : {
                            border : "1px #DDDDDD solid"
                        },
                        "&.Mui-focused fieldset" : {
                            border : "1px #DDDDDD solid"
                        }
                    }
                }
            }
        },
        MuiTypography : {
            styleOverrides : {
                root : {
                    fontFamily : "Nunito Sans",
                    textTransform : "capitalize",
                    fontSize : 14,
                    fontWeight: 600
                }
            }
        },
        MuiLink : {
            styleOverrides : {
                root : {
                    fontFamily : "Nunito Sans",
                    textTransform : "capitalize",
                    fontSize : 18,
                    fontWeight: 400
                }
            }
        },
        MuiModal : {
            styleOverrides  : {
                root : {
                    display : 'flex',
                    justifyContent: "center",
                    alignItems : "center",
                    flex : 1
                }
            }
        },
        // MuiPaper : {
        //     styleOverrides : {
        //         elevation : 0,
        //         root : {
        //             background : "transparent linear-gradient(180deg, #000000CC 0%, #3D3D3D99 100%) 0% 0% no-repeat padding-box",
        //             color : "#FFFFFF",
        //             fontSize : "16px",
        //             fontWeight : 300
        //         }
        //     }
        // }
    }
})