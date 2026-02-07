import React, { useEffect } from 'react';
import styles from './Frame.module.scss';
import { useNavStore } from 'ui/shared/hooks/useNavStore';

interface FrameProps extends React.HTMLProps<HTMLElement> {
  children?: React.ReactNode;
  id: string;
}

const Frame: React.FC<FrameProps> = ({ children, id, ...props }) => {
  const setActiveSection = useNavStore((s) => s.setActiveSection);

  useEffect(() => {
    setActiveSection(id);
  }, [id]);
  return (
    <main
      id="main-content"
      data-section={id}
      {...props}
      className={styles.frame}
    >
      {children}
    </main>
  );
};

export default Frame;
