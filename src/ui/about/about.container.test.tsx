import React from 'react';
import { render, screen, fireEvent } from 'ui/test-utils';
import AboutContainer from './about.container';

jest.mock('ui/shared/stores/navStore', () => ({
  useNavStore: jest.fn((selector) => selector({ setActiveSection: jest.fn() })),
}));

// Mock lucide-react icons to avoid issues
jest.mock('lucide-react', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    Github: () => React.createElement('span', { 'data-testid': 'github-icon' }),
    Linkedin: () =>
      React.createElement('span', { 'data-testid': 'linkedin-icon' }),
    Mail: () => React.createElement('span', { 'data-testid': 'mail-icon' }),
    MapPin: () =>
      React.createElement('span', { 'data-testid': 'map-pin-icon' }),
  };
});

describe('AboutContainer', () => {
  it('renders the hero section with name and role', () => {
    render(<AboutContainer />);
    expect(
      screen.getByRole('heading', { name: 'Reilly Goulding' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Staff Full Stack Developer')).toBeInTheDocument();
    expect(screen.getByText('Calgary, AB')).toBeInTheDocument();
  });

  it('renders the "What I Do" section', () => {
    render(<AboutContainer />);
    expect(screen.getByText(/What I Do/i)).toBeInTheDocument();
    expect(
      screen.getByText(/I focus on platform engineering and architecture/i),
    ).toBeInTheDocument();
  });

  it('renders the "Relevant Background" section', () => {
    render(<AboutContainer />);
    expect(screen.getByText(/Relevant Background/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Technical Leadership/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Strategy & Planning/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Core Strengths" section with technologies', () => {
    render(<AboutContainer />);
    expect(screen.getByText('Core Strengths')).toBeInTheDocument();
    expect(screen.getByText('Technologies')).toBeInTheDocument();
    expect(screen.getByText('Rails')).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toBeInTheDocument();
  });

  it('renders connect buttons', () => {
    render(<AboutContainer />);
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('opens LinkedIn link on click', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<AboutContainer />);
    const button = screen.getByText('LinkedIn');
    fireEvent.click(button);
    expect(openSpy).toHaveBeenCalledWith(
      'https://www.linkedin.com/in/reillysteere/',
      '_blank',
    );
    openSpy.mockRestore();
  });

  it('opens Email link on click', () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });

    render(<AboutContainer />);
    const button = screen.getByText('Email');
    fireEvent.click(button);
    expect(window.location.href).toBe('mailto:reilly.steere@gmail.com');

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });
});
