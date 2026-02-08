import React, { useEffect, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavStore } from 'ui/shared/hooks/useNavStore';
import { SignInButton } from '../SignIn/SignInButton';
import { PerformanceBadge } from '../PerformanceBadge/PerformanceBadge';
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
  Activity,
  GitBranch,
  FileText,
  Gauge,
  Accessibility,
  MoreHorizontal,
} from 'lucide-react';

const navItems = [
  { name: 'About', path: '/about', Icon: User },
  { name: 'Blog', path: '/blog', Icon: Book },
  { name: 'Experience', path: '/experience', Icon: Briefcase },
  { name: 'Projects', path: '/projects', Icon: Layers },
  { name: 'Case Studies', path: '/case-studies', Icon: FileText },
  { name: 'Status', path: '/status', Icon: Activity },
  { name: 'Performance', path: '/performance', Icon: Gauge },
  { name: 'Accessibility', path: '/accessibility', Icon: Accessibility },
  { name: 'Architecture', path: '/architecture', Icon: GitBranch },
];

// Primary items for bottom nav (most important)
const primaryNavItems = navItems.slice(0, 4);
// Secondary items shown in "More" menu
const secondaryNavItems = navItems.slice(4);

export const NavigationRail: React.FC = () => {
  const isExpanded = useNavStore((s) => s.isExpanded);
  const toggleExpand = useNavStore((s) => s.toggleExpand);
  const setExpanded = useNavStore((s) => s.setExpanded);
  const theme = useNavStore((s) => s.theme);
  const toggleTheme = useNavStore((s) => s.toggleTheme);
  const activeSection = useNavStore((s) => s.activeSection);
  const location = useLocation();
  const isOnPerformancePage = location.pathname === '/performance';
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile) {
        setExpanded(false);
        setMoreMenuOpen(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setExpanded]);

  // Check if current path is in secondary items
  const isSecondaryActive = secondaryNavItems.some(
    (item) => activeSection === item.name.toLowerCase(),
  );

  return (
    <>
      {/* Desktop/Tablet Side Rail */}
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
            aria-label={
              isExpanded ? 'Collapse navigation' : 'Expand navigation'
            }
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

          {!isOnPerformancePage && (
            <div className={styles.performanceBadgeWrapper}>
              <PerformanceBadge />
            </div>
          )}

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={styles.themeToggle}
          >
            {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
          </button>

          <SignInButton />
        </motion.div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className={styles.bottomNav} aria-label="Mobile navigation">
        {primaryNavItems.map(({ name, path, Icon }) => (
          <Link
            key={name}
            to={path}
            className={`${styles.bottomNavLink} ${activeSection === name.toLowerCase() ? styles.bottomNavActive : ''}`}
          >
            <Icon size={20} aria-hidden="true" />
            <span className={styles.bottomNavLabel}>{name}</span>
          </Link>
        ))}

        {/* More button */}
        <button
          className={`${styles.bottomNavLink} ${isSecondaryActive || moreMenuOpen ? styles.bottomNavActive : ''}`}
          onClick={() => setMoreMenuOpen(!moreMenuOpen)}
          aria-expanded={moreMenuOpen}
          aria-label="More navigation options"
        >
          <MoreHorizontal size={20} aria-hidden="true" />
          <span className={styles.bottomNavLabel}>More</span>
        </button>

        {/* More menu overlay */}
        <AnimatePresence>
          {moreMenuOpen && (
            <>
              <motion.div
                className={styles.moreOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMoreMenuOpen(false)}
              />
              <motion.div
                className={styles.moreMenu}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                {secondaryNavItems.map(({ name, path, Icon }) => (
                  <Link
                    key={name}
                    to={path}
                    className={`${styles.moreMenuItem} ${activeSection === name.toLowerCase() ? styles.moreMenuActive : ''}`}
                    onClick={() => setMoreMenuOpen(false)}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span>{name}</span>
                  </Link>
                ))}
                <div className={styles.moreMenuDivider} />
                <button
                  onClick={() => {
                    toggleTheme();
                    setMoreMenuOpen(false);
                  }}
                  className={styles.moreMenuItem}
                >
                  {theme === 'light' ? (
                    <Moon size={20} aria-hidden="true" />
                  ) : (
                    <Sun size={20} aria-hidden="true" />
                  )}
                  <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};
