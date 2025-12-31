import { useQuery } from '@tanstack/react-query';
import { Project } from 'shared/types';

interface UseProjectsResult {
  projects: Project[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Enterprise Resource Planning System',
    shortDescription:
      'A comprehensive ERP solution for a mid-sized manufacturing firm.',
    role: 'Lead Frontend Developer',
    requirements: [
      'Migrate legacy desktop application to a web-based platform.',
      'Ensure real-time data synchronization across multiple departments.',
      'Implement role-based access control for 500+ users.',
      'Optimize performance for low-bandwidth environments.',
    ],
    execution:
      'Led a team of 4 developers to build the frontend using React and TypeScript. Implemented a custom state management solution using Zustand to handle complex data flows. Utilized WebSockets for real-time updates and Service Workers for offline capabilities. Collaborated closely with the backend team to define API contracts and ensure data integrity.',
    technologies: ['React', 'TypeScript', 'Zustand', 'WebSockets', 'SCSS'],
    startDate: '2023-01-01',
    endDate: '2023-12-31',
  },
  {
    id: '2',
    title: 'Health & Wellness Mobile App',
    shortDescription:
      'A cross-platform mobile application for tracking fitness and nutrition.',
    role: 'Full Stack Developer',
    requirements: [
      'Develop a user-friendly interface for tracking daily activities.',
      'Integrate with third-party health APIs (Apple Health, Google Fit).',
      'Implement push notifications for workout reminders.',
      'Ensure data privacy and HIPAA compliance.',
    ],
    execution:
      'Built the mobile app using React Native and the backend using NestJS. Designed a secure API architecture with OAuth2 authentication. Implemented data encryption at rest and in transit. Created a dashboard for users to visualize their progress using D3.js.',
    technologies: ['React Native', 'NestJS', 'PostgreSQL', 'D3.js', 'OAuth2'],
    startDate: '2022-06-01',
    endDate: '2022-12-31',
  },
  {
    id: '3',
    title: 'Automated Trading Bot',
    shortDescription:
      'A high-frequency trading bot for cryptocurrency markets.',
    role: 'Backend Engineer',
    requirements: [
      'Execute trades with sub-millisecond latency.',
      'Analyze market data in real-time to identify trends.',
      'Implement risk management strategies to minimize losses.',
      'Provide a web interface for monitoring and configuration.',
    ],
    execution:
      'Developed the core trading engine using Node.js and C++ addons for performance-critical components. Implemented a microservices architecture to handle data ingestion, analysis, and execution independently. Used Redis for high-speed caching and message queuing. Built a monitoring dashboard using React and GraphQL.',
    technologies: ['Node.js', 'C++', 'Redis', 'GraphQL', 'Docker'],
    startDate: '2021-01-01',
    endDate: '2022-05-31',
  },
];

const fetchProjects = (): Promise<Project[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_PROJECTS);
    }, 500);
  });
};

export function useProjects(): UseProjectsResult {
  const { data, isLoading, isError, error, refetch } = useQuery<
    Project[],
    Error
  >({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    projects: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
