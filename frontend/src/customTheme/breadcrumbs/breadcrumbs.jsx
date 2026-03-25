import React from 'react'
import { Breadcrumbs, Link, Box } from '@mui/material'
import { useLocation } from 'react-router-dom'

const DynamicBreadcrumb = (props) => {
    let location = useLocation()
    let breads = location.pathname.split("/").filter(element => element)
    let filteredBread = []
    if (breads[0] === 'views') {
        filteredBread = location.pathname.split("/").filter(element => element).filter(el => el !== "views")
    } else if (breads[0] === 'auth'){
        filteredBread = location.pathname.split("/").filter(element => element).filter(el => el !== "auth")
    }
    
    const linkGenerator = (index) => {
        let link = ""
        for (let i = 0; i <= index; i++) {
            link = link + "/" + filteredBread[i]
        }
        if (breads[0] === 'views') {
            return '/views' + link
        } else if (breads[0] === 'auth') {
            return '/auth' + link
        }
    }

    // Format breadcrumb text - decode URL encoding and clean up
    const formatBreadcrumb = (text) => {
        try {
            // Decode URL encoded characters
            const decoded = decodeURIComponent(text)
            // Replace hyphens and underscores with spaces, convert to title case
            return decoded.toUpperCase().replace(/[-_]/g, ' ')
        } catch {
            return text.toUpperCase().replace(/[-_]/g, ' ')
        }
    }

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                alignItems: 'center',
                maxWidth: '100%',
                overflow: 'hidden'
            }}
        >
            <Breadcrumbs 
                aria-label="breadcrumb" 
                className="headerBreadcrumbs"
                sx={{
                    '& .MuiBreadcrumbs-ol': {
                        flexWrap: 'nowrap',
                    },
                    '& .MuiBreadcrumbs-separator': {
                        mx: 0.5,
                    }
                }}
            >
                {filteredBread.map((k, i) => 
                    <Link 
                        key={`breadcrumbs-${i}`} 
                        underline="hover" 
                        color={props.color ? props.color : "secondary"} 
                        href={(i === filteredBread.length - 1) ? null : linkGenerator(i)} 
                        aria-current="page"
                        sx={{
                            fontSize: { xs: '11px', sm: '12px', md: '13px' },
                            fontWeight: (i === filteredBread.length - 1) ? 'bold' : '400',
                            whiteSpace: 'nowrap',
                            maxWidth: { xs: '80px', sm: '120px', md: '180px' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'inline-block',
                            verticalAlign: 'middle',
                        }}
                        title={formatBreadcrumb(k)}
                    >
                        {formatBreadcrumb(k)}
                    </Link>
                )}
            </Breadcrumbs>
        </Box>
    )
}

export default DynamicBreadcrumb