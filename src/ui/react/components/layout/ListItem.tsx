import React from 'react';
import styles from './layout.module.scss';

/**
 * ListItemProps defines the props for the ListItem component.
 * @property {string} content - The text content of the ListItem.
 */
interface ListItemProps {
  children: string;
}

/**
 * Heading component renders a semantic heading (h1-h5) with provided content and style.
 * @param {HeadingProps} props - The props for the component.
 * @returns {JSX.Element} The rendered heading element.
 */
const ListItem: React.FC<ListItemProps> = ({ children }) => {
  return <li className={styles.listItem}>{children}</li>;
};

export default ListItem;
