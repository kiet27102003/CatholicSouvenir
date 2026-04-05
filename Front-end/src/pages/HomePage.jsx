import React from 'react';
import Header from '../components/Header/Header';
import Hero from '../components/Hero/Hero';
import PlatformEcosystem from '../components/PlatformEcosystem/PlatformEcosystem';
import FeatureProcess from '../components/FeatureProcess/FeatureProcess';
import ProductGrid from '../components/ProductGrid/ProductGrid';
import Footer from '../components/Footer/Footer';

const HomePage = () => {
    return (
        <div className="homepage">
            <Header />
            <main>
                <Hero />
                <PlatformEcosystem />
                <FeatureProcess />
                <ProductGrid />
            </main>
            <Footer />
        </div>
    );
};

export default HomePage;
