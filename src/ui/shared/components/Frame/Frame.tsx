import React, { useEffect } from 'react';
import styles from './frame.module.scss';
import { useNavStore } from 'ui/shared/stores/navStore';
import Header from './Header';

interface FrameProps extends React.HTMLProps<HTMLDivElement> {
  children?: React.ReactNode;
  id: string;
}

const Frame: React.FC<FrameProps> = ({ children, id, ...props }) => {
  const setActiveSection = useNavStore((s) => s.setActiveSection);

  useEffect(() => {
    setActiveSection(id);
  }, [id]);
  return (
    <section id={id} {...props} className={styles.frame}>
      <Header />
      {children}
    </section>
  );
};

export default Frame;
