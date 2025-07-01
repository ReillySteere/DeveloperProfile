import React from 'react';

/**
 * ListItemProps defines the props for the ListItem component.
 * @property {string} content - The text content of the ListItem.
 */
type ListItemProps = {
  children: string;
} & React.HTMLAttributes<HTMLLIElement>;

/**
 * Heading component renders a semantic heading (h1-h5) with provided content and style.
 * @param {HeadingProps} props - The props for the component.
 * @returns {JSX.Element} The rendered heading element.
 */
const ListItem: React.FC<ListItemProps> = ({ children, ...props }) => {
  return <li {...props}>{children}</li>;
};

export default ListItem;
