import React from 'react';
import Placeholder from './containers/placeholder/placeholder';
import styles from './styles.module.scss';
import Navigation from './containers/navigation/';

const App = () => {
  const [ActiveComponent, setActiveComponent] = React.useState<React.ReactNode>(
    () => <Placeholder />,
  );

  return (
    <div className={styles.container}>
      <Navigation onNavigation={setActiveComponent} />
      {ActiveComponent}
    </div>
  );
};

export default App;
