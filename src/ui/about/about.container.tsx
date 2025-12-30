import React from 'react';
import { Frame } from 'ui/shared/components';
import styles from './about.module.scss';
import { HeroSection } from './components/HeroSection';
import { WhatIDoSection } from './components/WhatIDoSection';
import { CoreStrengthsSection } from './components/CoreStrengthsSection';
import { ConnectSection } from './components/ConnectSection';
import { HowIWorkSection } from './components/HowIWorkSection';

export default function AboutContainer() {
  return (
    <Frame id="about">
      <div className={styles.container}>
        <HeroSection />
        <WhatIDoSection />
        <HowIWorkSection />
        <CoreStrengthsSection />
        <ConnectSection />
      </div>
    </Frame>
  );
}
