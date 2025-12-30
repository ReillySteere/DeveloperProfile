import React, { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useNavStore } from 'ui/shared/stores/navStore';
import styles from './NavigationRail.module.scss';
import {
  User,
  Book,
  Briefcase,
  Layers,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';

const navItems = [
  { name: 'About', path: '/about', Icon: User },
  { name: 'Blog', path: '/blog', Icon: Book },
  { name: 'Experience', path: '/experience', Icon: Briefcase },
  { name: 'Projects', path: '/projects', Icon: Layers },
];

export const NavigationRail: React.FC = () => {
  const isExpanded = useNavStore((s) => s.isExpanded);
  const toggleExpand = useNavStore((s) => s.toggleExpand);
  const setExpanded = useNavStore((s) => s.setExpanded);
  const theme = useNavStore((s) => s.theme);
  const toggleTheme = useNavStore((s) => s.toggleTheme);
  const activeSection = useNavStore((s) => s.activeSection);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setExpanded(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setExpanded]);

  return (
    <nav className={styles.navigation} aria-label="Main navigation">
      <motion.div
        animate={{ width: isExpanded ? 250 : 60 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={styles.rail}
      >
        {/* Expand/Collapse Toggle */}
        <button
          onClick={toggleExpand}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
          className={`${styles.toggleButton} ${isExpanded ? styles.extended : styles.collapsed}`}
        >
          {isExpanded ? <X size={24} /> : <Menu size={24} />}
        </button>
        <ul className={styles.navList}>
          {navItems.map(({ name, path, Icon }) => (
            <li key={name} className={styles.navItem}>
              {/* Navigation Link */}
              <Link
                to={path}
                className={`${styles.navLink} ${activeSection === name.toLowerCase() ? styles.activeLink : ''}`}
              >
                <Icon size={24} aria-hidden="true" />
                {isExpanded && (
                  <span className={styles.label}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={styles.themeToggle}
        >
          {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
        </button>
      </motion.div>
    </nav>
  );
};
