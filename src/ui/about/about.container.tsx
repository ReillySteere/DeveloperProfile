import React from 'react';
import { Frame } from 'ui/shared/components';
import styles from './about.module.scss';
import { HeroSection } from './components/HeroSection';
import { WhatIDoSection } from './components/WhatIDoSection';
import { RelevantBackgroundSection } from './components/RelevantBackgroundSection';
import { CoreStrengthsSection } from './components/CoreStrengthsSection';
import { HowIWorkSection } from './components/HowIWorkSection';
import { ConnectSection } from './components/ConnectSection';

export default function AboutContainer() {
  return (
    <Frame id="about">
      <div className={styles.container}>
        <HeroSection />
        <WhatIDoSection />
        <RelevantBackgroundSection />
        <CoreStrengthsSection />
        <HowIWorkSection />
        <ConnectSection />
      </div>
    </Frame>
  );
}
