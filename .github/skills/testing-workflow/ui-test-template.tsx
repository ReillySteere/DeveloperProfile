// @ts-nocheck
import React from 'react';
import { render, screen, waitFor } from 'test-utils'; // Use local test-utils
import { MyContainer } from './my.container';
import axios from 'axios';

// Mock axios globally for this test file
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MyContainer Integration', () => {
  beforeEach(() => {
    mockedAxios.get.mockClear();
  });

  it('renders loading state initially', () => {
    // Return a never-resolving promise to simulate loading
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<MyContainer />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders data after fetch', async () => {
    // Mock successful API response
    // Note: Adjust the structure based on what your hook expects (e.g. data vs data.data)
    mockedAxios.get.mockResolvedValue({ data: 'Test Data' });

    render(<MyContainer />);

    await waitFor(() => {
      expect(screen.getByText('Test Data')).toBeInTheDocument();
    });
  });
});
