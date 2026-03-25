import React, { useEffect } from 'react';
import { isMobile } from 'react-device-detect';
const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div style={{ margin: isMobile ? '35px 10px' : 80 }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '26px', fontFamily: 'Arial', color: '#000', marginBottom: '20px' }}>TERMS OF SERVICE</h1>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', marginBottom: '20px' }}>
          <strong>Last updated: November 20, 2022</strong>
        </p>
        <h2 style={{ fontSize: '19px', fontFamily: 'Arial', color: '#000', marginTop: '30px' }}>1. AGREEMENT TO TERMS</h2>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and Edwiser Innovation Hub Private Limited ("Company," "we," "us," or "our"), concerning your access to and use of the MySchool website and mobile application as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
        </p>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          You agree that by accessing the Site, you have read, understood, and agreed to be bound by all of these Terms of Service. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF SERVICE, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SITE AND YOU MUST DISCONTINUE USE IMMEDIATELY.
        </p>
        <h2 style={{ fontSize: '19px', fontFamily: 'Arial', color: '#000', marginTop: '30px' }}>2. INTELLECTUAL PROPERTY RIGHTS</h2>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
        </p>
        <h2 style={{ fontSize: '19px', fontFamily: 'Arial', color: '#000', marginTop: '30px' }}>3. USER REPRESENTATIONS</h2>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms of Service; (4) you are not a minor in the jurisdiction in which you reside, or if a minor, you have received parental permission to use the Site.
        </p>
        <h2 style={{ fontSize: '19px', fontFamily: 'Arial', color: '#000', marginTop: '30px' }}>4. USER REGISTRATION</h2>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          You may be required to register with the Site. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
        </p>
        <h2 style={{ fontSize: '19px', fontFamily: 'Arial', color: '#000', marginTop: '30px' }}>5. PROHIBITED ACTIVITIES</h2>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
        </p>
        <h2 style={{ fontSize: '19px', fontFamily: 'Arial', color: '#000', marginTop: '30px' }}>6. CONTACT US</h2>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:
        </p>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
          <strong>Edwiser Innovation Hub Private Limited</strong><br />
          Email: info@myschool.in<br />
          Website: <a href="http://www.myschool.in" style={{ color: '#3030F1' }}>www.myschool.in</a>
        </p>
      </div>
    </div>
  );
};
export default Terms;
