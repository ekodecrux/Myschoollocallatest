import React, { useEffect } from 'react';
import { isMobile } from 'react-device-detect';
const Cookies = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div style={{ margin: isMobile ? '35px 10px' : 80 }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '26px', fontFamily: 'Arial', color: '#000', marginBottom: '20px' }}>COOKIE POLICY</h1>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', marginBottom: '20px' }}>
          <strong>Last updated: November 20, 2022</strong>
        </p>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          This Cookie Policy explains how Edwiser Innovation Hub Private Limited ("Company," "we," "us," and "our") uses cookies and similar technologies to recognize you when you visit our website at <a href="http://www.myschool.in" style={{ color: '#3030F1' }}>www.myschool.in</a> ("Website"). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
        </p>
        <h2 style={{ fontSize: '19px', fontFamily: 'Arial', color: '#000', marginTop: '30px' }}>WHAT ARE COOKIES?</h2>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
        </p>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          Cookies set by the website owner (in this case, Edwiser Innovation Hub Private Limited) are called "first-party cookies." Cookies set by parties other than the website owner are called "third-party cookies." Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics).
        </p>
        <h2 style={{ fontSize: '19px', fontFamily: 'Arial', color: '#000', marginTop: '30px' }}>WHY DO WE USE COOKIES?</h2>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Website. Third parties serve cookies through our Website for advertising, analytics, and other purposes.
        </p>
        <h2 style={{ fontSize: '19px', fontFamily: 'Arial', color: '#000', marginTop: '30px' }}>TYPES OF COOKIES WE USE</h2>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          <strong>Essential Cookies:</strong> These cookies are strictly necessary to provide you with services available through our Website and to use some of its features, such as access to secure areas.
        </p>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          <strong>Performance Cookies:</strong> These cookies are used to enhance the performance and functionality of our Website but are non-essential to their use. However, without these cookies, certain functionality may become unavailable.
        </p>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          <strong>Analytics Cookies:</strong> These cookies collect information that is used either in aggregate form to help us understand how our Website is being used or how effective our marketing campaigns are, or to help us customize our Website for you.
        </p>
        <h2 style={{ fontSize: '19px', fontFamily: 'Arial', color: '#000', marginTop: '30px' }}>HOW CAN YOU CONTROL COOKIES?</h2>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by clicking on the appropriate opt-out links provided below or by setting your browser to refuse all or some browser cookies, or to alert you when cookies are being sent. However, if you choose to reject cookies, you may still use our Website though your access to some functionality and areas may be restricted.
        </p>
        <h2 style={{ fontSize: '19px', fontFamily: 'Arial', color: '#000', marginTop: '30px' }}>CONTACT US</h2>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          If you have any questions about our use of cookies or other technologies, please email us at info@myschool.in.
        </p>
      </div>
    </div>
  );
};
export default Cookies;
