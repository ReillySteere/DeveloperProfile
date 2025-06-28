import Goals from 'ui/react/containers/goals';
import Placeholder from 'ui/react/containers/placeholder';
export type SectionType = {
  name: string;
  component: React.ComponentType;
};

export default {
  About: {
    name: 'About',
    component: Placeholder,
  },
  Experience: {
    name: 'Experience',
    component: Placeholder,
  },
  Projects: {
    name: 'Projects',
    component: Placeholder,
  },
  Goals: {
    name: 'Goals',
    component: Goals,
  },
  Blog: {
    name: 'Blog',
    component: Placeholder,
  },
};
