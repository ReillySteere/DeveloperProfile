import React from 'react';

/**
 * ListProps defines the props for the List component.
 * @property {React.ReactNode} children - The list items to render.
 * @property {boolean} ordered - Whether the list is ordered (<ol>) or unordered (<ul>).
 */
type ListProps = {
  children: React.ReactNode;
  ordered?: boolean;
} & React.HTMLAttributes<HTMLUListElement | HTMLOListElement>;

/**
 * List component renders a semantic <ul> or <ol> tag with provided content and style.
 * @param {ListProps} props - The props for the component.
 * @returns {JSX.Element} The rendered list element.
 */
const List: React.FC<ListProps> = ({ children, ordered = false, ...props }) => {
  const ListTag = ordered ? 'ol' : 'ul';
  return <ListTag {...props}>{children}</ListTag>;
};

export default List;
