import React from 'react';
import { render, screen, fireEvent, waitFor } from 'ui/test-utils';
import axios from 'axios';
import AboutContainer from './about.container';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('ui/shared/hooks/useNavStore', () => ({
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
    Download: () =>
      React.createElement('span', { 'data-testid': 'download-icon' }),
    Loader2: () =>
      React.createElement('span', { 'data-testid': 'loader-icon' }),
  };
});

describe('AboutContainer', () => {
  const createObjectURLMock = jest.fn(() => 'mock-url');
  const revokeObjectURLMock = jest.fn();

  beforeAll(() => {
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;
    jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

  it('handles the resume download process', async () => {
    const blob = new Blob(['resume content'], { type: 'application/pdf' });
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockedAxios.get.mockReturnValue(promise as any);

    render(<AboutContainer />);
    const downloadButton = screen.getByRole('button', {
      name: /download resume/i,
    });

    fireEvent.click(downloadButton);

    // Verify loading state
    await waitFor(() => {
      expect(screen.getByText('Downloading...')).toBeInTheDocument();
    });
    expect(downloadButton).toBeDisabled();

    // Resolve the API call
    resolvePromise!({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="resume.pdf"' },
    });

    // Verify API call
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/about/resume', {
        responseType: 'blob',
      });
    });

    // Verify download trigger
    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalledWith(blob);
    });

    // Verify state restoration
    await waitFor(() => {
      expect(screen.getByText('Download Resume')).toBeInTheDocument();
    });
    expect(downloadButton).toBeEnabled();
  });

  it('handles missing filename in download response', async () => {
    const blob = new Blob(['resume content'], { type: 'application/pdf' });
    mockedAxios.get.mockResolvedValueOnce({
      data: blob,
      headers: {}, // No content-disposition
    });

    render(<AboutContainer />);
    const downloadButton = screen.getByRole('button', {
      name: /download resume/i,
    });

    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    // Wait for the button to reset, indicating the mutation has settled (failed)
    await waitFor(() => {
      expect(downloadButton).toBeEnabled();
    });

    // Verify createObjectURL was NOT called due to error
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });
});
