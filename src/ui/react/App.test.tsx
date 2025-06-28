import React from 'react';
import { render, screen } from 'ui/react/test-utils';
import App from './App';

// Updated jest.mock to avoid referencing out-of-scope React
jest.mock('./components/HealthStatus', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function HealthStatusMock() {
      return React.createElement(
        'div',
        { 'data-testid': 'health-status' },
        'Health Status Mock',
      );
    },
  };
});

describe('App Component', () => {
  it('renders the main container with correct child elements', () => {
    const { container } = render(<App />);
    const mainContainer = container.querySelector('div');
    expect(mainContainer).toBeInTheDocument();
  });

  it('renders the phaser container with proper class', () => {
    const { container } = render(<App />);
    const phaserContainer = container.querySelector('#phaser-container');
    expect(phaserContainer).toBeInTheDocument();
    expect(phaserContainer).toHaveClass('phaserContainer');
  });

  it('renders the UI overlay container with proper class', () => {
    const { container } = render(<App />);
    const uiOverlay = container.querySelector('#root-ui');
    expect(uiOverlay).toBeInTheDocument();
    expect(uiOverlay).toHaveClass('uiOverlay');
  });

  it('renders the HealthStatus component', () => {
    render(<App />);
    const healthStatus = screen.getByTestId('health-status');
    expect(healthStatus).toBeInTheDocument();
    expect(healthStatus).toHaveTextContent('Health Status Mock');
  });

  it('matches snapshot', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('applies the proper container class on the root element', () => {
    const { container } = render(<App />);
    const rootElement = container.firstChild;
    expect(rootElement).toHaveClass('container');
  });
});
