import React, { useEffect } from 'react';
import styles from './frame.module.scss';
import { useNavStore } from 'ui/stores/navStore';
import Header from './Header';

interface FrameProps extends React.HTMLProps<HTMLDivElement> {
  children?: React.ReactNode;
}

const Frame: React.FC<FrameProps> = ({ children, ...props }) => {
  const setActiveSection = useNavStore((s) => s.setActiveSection);

  useEffect(() => {
    setActiveSection(props.id || 'about');
  }, [props.id]);
  return (
    <section {...props} className={styles.frame}>
      <Header />
      {children}
    </section>
  );
};

export default Frame;
