import React, { useEffect } from 'react';

/**
 * MySchool Smart Search - Chatbot Widget Component
 * 
 * This component integrates the MySchool chatbot widget into the React application.
 * The chatbot provides:
 * - Smart Search with autocomplete
 * - Multilingual support (English, Telugu, Hindi, Gujarati)
 * - Voice Input (Speech-to-text)
 * - Responsive design for mobile and desktop
 */
const ChatbotWidget = () => {
  useEffect(() => {
    // Configuration
    const CHATBOT_URL = 'https://demo.myschoolchatbot.in';
    const WIDGET_ID = 'myschool-chatbot-widget';
    const IFRAME_ID = 'myschool-chatbot-iframe';
    
    // Check if widget already exists
    if (document.getElementById(WIDGET_ID)) {
      return;
    }

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = WIDGET_ID;
    widgetContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 0;
      height: 0;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'myschool-chatbot-toggle';
    toggleBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(233, 30, 99, 0.4);
      transition: all 0.3s ease;
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    toggleBtn.innerHTML = '💬';
    toggleBtn.title = 'Open MySchool Smart Search';

    // Create iframe with permissions for microphone, camera, geolocation
    const iframe = document.createElement('iframe');
    iframe.id = IFRAME_ID;
    iframe.src = CHATBOT_URL;
    iframe.title = 'MySchool AI Assistant';
    iframe.allow = 'microphone; camera; geolocation';
    iframe.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 420px;
      height: 600px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: none;
      z-index: 999997;
      background: white;
    `;

    // Handle responsive design for mobile
    const updateResponsiveStyles = () => {
      if (window.innerWidth < 480) {
        iframe.style.width = 'calc(100vw - 20px)';
        iframe.style.height = '70vh';
        iframe.style.bottom = '10px';
        iframe.style.right = '10px';
      } else {
        iframe.style.width = '420px';
        iframe.style.height = '600px';
        iframe.style.bottom = '90px';
        iframe.style.right = '20px';
      }
    };
    
    updateResponsiveStyles();

    // Toggle chatbot visibility
    const handleToggleClick = () => {
      const isVisible = iframe.style.display === 'block';
      iframe.style.display = isVisible ? 'none' : 'block';
      toggleBtn.innerHTML = isVisible ? '💬' : '✕';
      toggleBtn.title = isVisible ? 'Open MySchool Smart Search' : 'Close MySchool Smart Search';
    };
    toggleBtn.addEventListener('click', handleToggleClick);

    // Close chatbot when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest(`#${WIDGET_ID}`) && 
          !event.target.closest(`#${IFRAME_ID}`) &&
          !event.target.closest(`#myschool-chatbot-toggle`)) {
        iframe.style.display = 'none';
        toggleBtn.innerHTML = '💬';
        toggleBtn.title = 'Open MySchool Smart Search';
      }
    };
    document.addEventListener('click', handleClickOutside);

    // Handle window resize for responsive design
    window.addEventListener('resize', updateResponsiveStyles);

    // Add hover effect
    const handleMouseEnter = () => {
      toggleBtn.style.transform = 'scale(1.1)';
    };
    const handleMouseLeave = () => {
      toggleBtn.style.transform = 'scale(1)';
    };
    toggleBtn.addEventListener('mouseenter', handleMouseEnter);
    toggleBtn.addEventListener('mouseleave', handleMouseLeave);

    // Append to body
    document.body.appendChild(widgetContainer);
    document.body.appendChild(toggleBtn);
    document.body.appendChild(iframe);

    // Expose API for manual control
    window.MySchoolChatbot = {
      open: function() {
        const iframeEl = document.getElementById(IFRAME_ID);
        const toggleBtnEl = document.getElementById('myschool-chatbot-toggle');
        if (iframeEl) {
          iframeEl.style.display = 'block';
          if (toggleBtnEl) {
            toggleBtnEl.innerHTML = '✕';
            toggleBtnEl.title = 'Close MySchool Smart Search';
          }
        }
      },
      close: function() {
        const iframeEl = document.getElementById(IFRAME_ID);
        const toggleBtnEl = document.getElementById('myschool-chatbot-toggle');
        if (iframeEl) {
          iframeEl.style.display = 'none';
          if (toggleBtnEl) {
            toggleBtnEl.innerHTML = '💬';
            toggleBtnEl.title = 'Open MySchool Smart Search';
          }
        }
      },
      toggle: function() {
        const iframeEl = document.getElementById(IFRAME_ID);
        if (iframeEl) {
          iframeEl.style.display = iframeEl.style.display === 'block' ? 'none' : 'block';
        }
      }
    };

    // Cleanup function
    return () => {
      toggleBtn.removeEventListener('click', handleToggleClick);
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', updateResponsiveStyles);
      toggleBtn.removeEventListener('mouseenter', handleMouseEnter);
      toggleBtn.removeEventListener('mouseleave', handleMouseLeave);
      
      // Remove elements from DOM
      if (document.getElementById(WIDGET_ID)) {
        document.getElementById(WIDGET_ID).remove();
      }
      if (document.getElementById('myschool-chatbot-toggle')) {
        document.getElementById('myschool-chatbot-toggle').remove();
      }
      if (document.getElementById(IFRAME_ID)) {
        document.getElementById(IFRAME_ID).remove();
      }
      
      // Clean up global API
      delete window.MySchoolChatbot;
    };
  }, []);

  return null;
};

export default ChatbotWidget;
