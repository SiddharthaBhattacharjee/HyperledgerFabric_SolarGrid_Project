// Loading.js
import React from 'react';
import './Loading.css';

const Loading = () => {
    return (
        <div className="loader-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading, please wait 5 seconds...</p>
        </div>
    );
};

export default Loading;
