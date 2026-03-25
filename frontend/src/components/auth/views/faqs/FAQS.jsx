import { Card } from '@mui/material';
import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import { Data } from './Constant';
import faqIcon from '../../../../assests/auth/faqIcon.svg'
import "./FAQS.css";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { MobileView } from 'react-device-detect';
const Faqs = () => {
  function cardselect() {
    return (
      <div className="faqsCardAccordionContainer">
        {Data.map((item, index) => {
          return (
            <Card elevation={0} key={index} className="faqsCardWrapper">
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                >
                  <Typography>{item.Question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    {item.Answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Card>
          );
        })}
      </div>
    );
  }
  return (
    <div className='accordionContainer'>
      {/* <MobileView>
        <MobileHeader />
      </MobileView> */}
      <div className='accordionImageTextContainer'>
        <img src={faqIcon} alt="faq icon" />
        <Typography fontSize='20px' fontWeight='bold'>FAQs</Typography>
      </div>
      <div className='cardMapFunctionContainer'>
        {cardselect()}
      </div>
    </div>
  );
};
export default Faqs; 