import React from 'react';

const ComingSoon = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            width: '100%',
            textAlign: 'center',
            padding: '40px 20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            margin: '20px 0'
        }}>
            <div style={{
                fontSize: '64px',
                marginBottom: '20px'
            }}>🚧</div>
            <h2 style={{ 
                color: '#333', 
                marginBottom: '15px',
                fontSize: '28px',
                fontWeight: '600'
            }}>Coming Soon</h2>
            <p style={{ 
                color: '#666',
                fontSize: '16px',
                maxWidth: '400px'
            }}>This feature is currently under development. Please check back later.</p>
        </div>
    );
};

export default ComingSoon;
