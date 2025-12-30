import React from 'react';
import { render, screen, fireEvent } from 'ui/test-utils';
import { QueryState } from './QueryState';

describe('QueryState', () => {
  const mockChildren = jest.fn((data) => <div>{data}</div>);
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    render(
      <QueryState isLoading={true} isError={false} children={mockChildren} />,
    );
    // Default loading component is 3 skeletons
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });

  it('renders custom loading component', () => {
    render(
      <QueryState
        isLoading={true}
        isError={false}
        loadingComponent={<div data-testid="custom-loading">Loading...</div>}
        children={mockChildren}
      />,
    );
    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <QueryState
        isLoading={false}
        isError={true}
        error={new Error('Test Error')}
        refetch={mockRefetch}
        children={mockChildren}
      />,
    );
    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders custom error component', () => {
    render(
      <QueryState
        isLoading={false}
        isError={true}
        errorComponent={<div data-testid="custom-error">Error!</div>}
        children={mockChildren}
      />,
    );
    expect(screen.getByTestId('custom-error')).toBeInTheDocument();
  });

  it('calls refetch when try again is clicked', () => {
    render(
      <QueryState
        isLoading={false}
        isError={true}
        refetch={mockRefetch}
        children={mockChildren}
      />,
    );
    fireEvent.click(screen.getByText('Try Again'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders empty state when data is empty', () => {
    render(
      <QueryState
        isLoading={false}
        isError={false}
        data={[]}
        isEmpty={(data) => Array.isArray(data) && data.length === 0}
        children={mockChildren}
      />,
    );
    expect(
      screen.getByText("There's nothing to show here yet."),
    ).toBeInTheDocument();
  });

  it('renders custom empty component', () => {
    render(
      <QueryState
        isLoading={false}
        isError={false}
        data={[]}
        isEmpty={(data) => Array.isArray(data) && data.length === 0}
        emptyComponent={<div data-testid="custom-empty">Empty!</div>}
        children={mockChildren}
      />,
    );
    expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
  });

  it('renders children when data is present', () => {
    render(
      <QueryState
        isLoading={false}
        isError={false}
        data="Test Data"
        children={mockChildren}
      />,
    );
    expect(screen.getByText('Test Data')).toBeInTheDocument();
    expect(mockChildren).toHaveBeenCalledWith('Test Data');
  });

  it('renders null when data is missing and not loading/error', () => {
    const { container } = render(
      <QueryState
        isLoading={false}
        isError={false}
        data={null}
        children={mockChildren}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
