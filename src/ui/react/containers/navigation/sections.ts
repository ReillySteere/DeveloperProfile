import Placeholder from '../placeholder/placeholder';
export type SectionType = {
  name: string;
  component: React.ComponentType;
};

export default {
  About: {
    name: 'about',
    component: Placeholder,
  },
  Experience: {
    name: 'experience',
    component: Placeholder,
  },
  Projects: {
    name: 'projects',
    component: Placeholder,
  },
  Goals: {
    name: 'goals',
    component: Placeholder,
  },
  Blog: {
    name: 'blog',
    component: Placeholder,
  },
};
