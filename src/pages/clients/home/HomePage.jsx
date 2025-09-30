import React from 'react';
import LandingPage from "../landing/LandingPage";
import { useOutletContext } from 'react-router-dom';

const HomePage = () => {
    const { onSignUp } = useOutletContext() || {};
    return <LandingPage onSignUp={onSignUp} />;
};

export default HomePage;
