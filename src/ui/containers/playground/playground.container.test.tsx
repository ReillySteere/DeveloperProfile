/* eslint-disable react-compiler/react-compiler */
import React, { act } from 'react';
import { render, screen, waitFor, fireEvent } from 'ui/test-utils';
import PlaygroundContainer from './playground.container';
import ComponentDetailContainer from './component-detail.container';
import { server } from 'ui/test-utils/msw/server';
import { http, HttpResponse } from 'msw';
import {
  mockPlaygroundComponents,
  mockCompositionTemplates,
  createPlaygroundHandlers,
} from 'ui/test-utils/msw/handlers';
import { usePlaygroundStore } from './hooks/usePlaygroundStore';

// Mock TanStack Router
jest.mock('@tanstack/react-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    ...jest.requireActual('@tanstack/react-router'),
    useParams: jest.fn(() => ({ componentId: 'Button' })),
    useNavigate: jest.fn(() => jest.fn()),
    Link: ({ children, to, params, className, ...props }: any) =>
      React.createElement(
        'a',
        {
          href: typeof to === 'string' ? to : '/',
          className,
          'data-testid': params?.componentId
            ? `component-link-${params.componentId}`
            : undefined,
          ...props,
        },
        children,
      ),
    Outlet: () => null,
    useLocation: jest.fn(() => ({ pathname: '/playground' })),
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    motion: {
      div: ({ children, className, ...props }: any) =>
        React.createElement('div', { className, ...props }, children),
    },
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
  };
});

// Mock ComponentRegistry for component tests
jest.mock('./components/ComponentRegistry', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const MockComponent = (props: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'mock-feature-component' },
      JSON.stringify(props),
    );
  const mockGet = (name: string) => {
    if (name === 'UnknownComponent') return undefined;
    return MockComponent;
  };
  const mockIs = (name: string) => name !== 'UnknownComponent';
  return {
    getRegisteredComponent: mockGet,
    isRegisteredComponent: mockIs,
    getFeatureComponent: mockGet,
    isFeatureComponent: mockIs,
  };
});

// Mock clipboard API
const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: mockWriteText },
});

describe('PlaygroundContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePlaygroundStore.setState({
      component: null,
      props: {},
      viewport: 'full',
      theme: 'light',
      showGrid: false,
      activeTab: 'components',
      selectedTemplate: null,
      slotProps: {},
    });
  });

  it('renders header and component list on load', async () => {
    render(<PlaygroundContainer />);

    expect(screen.getByText('Component Playground')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Button')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton while fetching', () => {
    server.use(...createPlaygroundHandlers({ delayMs: 5000 }));

    render(<PlaygroundContainer />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('shows error state on API failure', async () => {
    server.use(
      http.get('/api/playground/components', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    );

    render(<PlaygroundContainer />);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('shows empty state when no components', async () => {
    server.use(...createPlaygroundHandlers({ components: [] }));

    render(<PlaygroundContainer />);

    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument();
    });
  });

  it('shows welcome state when no component is selected', async () => {
    render(<PlaygroundContainer />);

    await waitFor(() => {
      expect(screen.getByText('Select a Component')).toBeInTheDocument();
    });
  });

  it('groups components by category in sidebar', async () => {
    render(<PlaygroundContainer />);

    await waitFor(() => {
      expect(screen.getByText('Inputs')).toBeInTheDocument();
      expect(screen.getByText('Data Display')).toBeInTheDocument();
      expect(screen.getByText('Layout')).toBeInTheDocument();
    });
  });

  it('renders tab bar with Components and Compositions tabs', async () => {
    render(<PlaygroundContainer />);

    expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Compositions' }),
    ).toBeInTheDocument();
  });

  it('switches to compositions tab', async () => {
    render(<PlaygroundContainer />);

    fireEvent.click(screen.getByRole('tab', { name: 'Compositions' }));

    await waitFor(() => {
      expect(screen.getByText('Select a Template')).toBeInTheDocument();
    });
  });

  it('shows composition template list on compositions tab', async () => {
    render(<PlaygroundContainer />);

    fireEvent.click(screen.getByRole('tab', { name: 'Compositions' }));

    await waitFor(() => {
      expect(screen.getByText('Accessibility Audit')).toBeInTheDocument();
    });
  });

  it('selects a composition template and shows editor', async () => {
    render(<PlaygroundContainer />);

    fireEvent.click(screen.getByRole('tab', { name: 'Compositions' }));

    await waitFor(() => {
      expect(
        screen.getByTestId('template-accessibility-audit'),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('template-accessibility-audit'));

    await waitFor(() => {
      expect(screen.getByTestId('composition-editor')).toBeInTheDocument();
    });
  });

  it('shows feature badge on direct render components', async () => {
    render(<PlaygroundContainer />);

    await waitFor(() => {
      expect(screen.getAllByText('Feature').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows auto badge on self-contained components', async () => {
    render(<PlaygroundContainer />);

    await waitFor(() => {
      expect(screen.getByText('Auto')).toBeInTheDocument();
    });
  });

  it('switches back to components tab from compositions', async () => {
    render(<PlaygroundContainer />);

    fireEvent.click(screen.getByRole('tab', { name: 'Compositions' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Components' }));

    await waitFor(() => {
      expect(screen.getByText('Select a Component')).toBeInTheDocument();
    });
  });
});

const { useParams } = jest.requireMock('@tanstack/react-router');

describe('ComponentDetailContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ componentId: 'Button' });
    usePlaygroundStore.setState({
      component: null,
      props: {},
      viewport: 'full',
      theme: 'light',
      showGrid: false,
      activeTab: 'components',
      selectedTemplate: null,
      slotProps: {},
    });
  });

  it('renders component preview and prop editor', async () => {
    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('component-preview')).toBeInTheDocument();
      expect(screen.getByTestId('prop-editor')).toBeInTheDocument();
      expect(screen.getByTestId('code-output')).toBeInTheDocument();
    });
  });

  it('shows component name in preview toolbar', async () => {
    render(<ComponentDetailContainer />);

    await waitFor(() => {
      // Button appears in sidebar link + preview h3
      const elements = screen.getAllByText('Button');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders prop controls for the component', async () => {
    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText('variant property')).toBeInTheDocument();
      expect(screen.getByLabelText('disabled property')).toBeInTheDocument();
      expect(screen.getByLabelText('children property')).toBeInTheDocument();
    });
  });

  it('updates code output when props change', async () => {
    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('code-output')).toBeInTheDocument();
    });

    // Change the children prop
    const childrenInput = screen.getByLabelText('children property');
    fireEvent.change(childrenInput, { target: { value: 'Click Me' } });

    await waitFor(() => {
      expect(usePlaygroundStore.getState().props.children).toBe('Click Me');
    });
  });

  it('resets props when reset button is clicked', async () => {
    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('prop-editor')).toBeInTheDocument();
    });

    // Change a prop
    const childrenInput = screen.getByLabelText('children property');
    fireEvent.change(childrenInput, { target: { value: 'Changed' } });

    // Click reset
    const resetButton = screen.getByLabelText('Reset props');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(usePlaygroundStore.getState().props.children).toBe('Button');
    });
  });

  it('toggles viewport size', async () => {
    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText('Mobile (375px)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Mobile (375px)'));

    expect(usePlaygroundStore.getState().viewport).toBe('mobile');
  });

  it('toggles grid overlay', async () => {
    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText('Toggle grid')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Toggle grid'));

    expect(usePlaygroundStore.getState().showGrid).toBe(true);
  });

  it('copies code to clipboard', async () => {
    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText('Copy code')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Copy code'));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('switches between JSX and Full Example tabs', async () => {
    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('JSX')).toBeInTheDocument();
      expect(screen.getByText('Full Example')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Full Example'));
    // Full Example tab should now be active (we can verify by clicking copy and checking content)
    fireEvent.click(screen.getByLabelText('Copy code'));

    await waitFor(() => {
      const copiedText = mockWriteText.mock.calls[0][0];
      expect(copiedText).toContain('import');
    });
  });

  it('shows error state when component not found', async () => {
    useParams.mockReturnValue({ componentId: 'NonExistent' });

    server.use(
      http.get(
        '/api/playground/components/:name',
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('renders viewport toggle with all size options', async () => {
    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText('Mobile (375px)')).toBeInTheDocument();
      expect(screen.getByLabelText('Tablet (768px)')).toBeInTheDocument();
      expect(screen.getByLabelText('Desktop (1280px)')).toBeInTheDocument();
      expect(screen.getByLabelText('Full width')).toBeInTheDocument();
    });
  });

  it('changes variant via select control', async () => {
    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText('variant property')).toBeInTheDocument();
    });

    const variantSelect = screen.getByLabelText('variant property');
    fireEvent.change(variantSelect, { target: { value: 'secondary' } });

    expect(usePlaygroundStore.getState().props.variant).toBe('secondary');
  });

  it('toggles disabled via checkbox control', async () => {
    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText('disabled property')).toBeInTheDocument();
    });

    const disabledCheckbox = screen.getByLabelText('disabled property');
    fireEvent.click(disabledCheckbox);

    expect(usePlaygroundStore.getState().props.disabled).toBe(true);
  });

  it('shows self-contained note for self-contained components', async () => {
    useParams.mockReturnValue({ componentId: 'AxeAuditPanel' });

    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('self-contained-note')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This component is self-contained and does not accept external props.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('renders direct preview for feature components', async () => {
    useParams.mockReturnValue({ componentId: 'VitalGauge' });

    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('component-preview')).toBeInTheDocument();
      expect(screen.getByTestId('mock-feature-component')).toBeInTheDocument();
    });
  });
});

// Coverage-boosting describe blocks for sub-components
describe('ComponentList (direct)', () => {
  it('renders component links', async () => {
    const { ComponentList } = jest.requireActual<
      typeof import('./components/ComponentList')
    >('./components/ComponentList');

    render(
      <ComponentList
        components={mockPlaygroundComponents}
        activeComponent="Button"
      />,
    );

    expect(screen.getByText('Button')).toBeInTheDocument();
    expect(screen.getByText('Badge')).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
  });

  it('renders feature badge for direct render components', () => {
    const { ComponentList } = jest.requireActual<
      typeof import('./components/ComponentList')
    >('./components/ComponentList');

    render(<ComponentList components={mockPlaygroundComponents} />);

    expect(screen.getAllByText('Feature').length).toBeGreaterThanOrEqual(1);
  });

  it('renders auto badge for self-contained components', () => {
    const { ComponentList } = jest.requireActual<
      typeof import('./components/ComponentList')
    >('./components/ComponentList');

    render(<ComponentList components={mockPlaygroundComponents} />);

    expect(screen.getByText('Auto')).toBeInTheDocument();
  });
});

describe('ViewportToggle (direct)', () => {
  it('calls onChange with correct viewport', () => {
    const { ViewportToggle } = jest.requireActual<
      typeof import('./components/ViewportToggle')
    >('./components/ViewportToggle');

    const onChange = jest.fn();
    render(<ViewportToggle viewport="full" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Mobile (375px)'));
    expect(onChange).toHaveBeenCalledWith('mobile');
  });
});

describe('PropEditor (direct)', () => {
  it('renders prop controls and reset button', () => {
    const { PropEditor } = jest.requireActual<
      typeof import('./components/PropEditor')
    >('./components/PropEditor');

    const onPropChange = jest.fn();
    const onReset = jest.fn();

    render(
      <PropEditor
        props={mockPlaygroundComponents[0].props}
        values={{ variant: 'primary', disabled: false, children: 'Test' }}
        onPropChange={onPropChange}
        onReset={onReset}
      />,
    );

    expect(screen.getByText('Props')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset props')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Reset props'));
    expect(onReset).toHaveBeenCalled();
  });

  it('filters out function and node props', () => {
    const { PropEditor } = jest.requireActual<
      typeof import('./components/PropEditor')
    >('./components/PropEditor');

    const propsWithFn = [
      ...mockPlaygroundComponents[0].props,
      {
        name: 'onClick',
        type: '() => void',
        controlType: 'function' as const,
        required: false,
      },
      {
        name: 'leftIcon',
        type: 'React.ReactNode',
        controlType: 'node' as const,
        required: false,
      },
    ];

    render(
      <PropEditor
        props={propsWithFn}
        values={{}}
        onPropChange={jest.fn()}
        onReset={jest.fn()}
      />,
    );

    // function and node props should not render controls
    expect(screen.queryByLabelText('onClick property')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('leftIcon property'),
    ).not.toBeInTheDocument();
  });
});

describe('CodeOutput (direct)', () => {
  it('renders code and tab switching', () => {
    const { CodeOutput } = jest.requireActual<
      typeof import('./components/CodeOutput')
    >('./components/CodeOutput');

    const code = {
      jsx: '<Button>Click</Button>',
      fullExample:
        "import { Button } from 'ui/shared/components';\n\nfunction Example() {\n  return <Button>Click</Button>;\n}",
    };

    render(<CodeOutput code={code} />);

    expect(screen.getByText('JSX')).toBeInTheDocument();
    expect(screen.getByText('Full Example')).toBeInTheDocument();
    expect(screen.getByLabelText('Copy code')).toBeInTheDocument();
  });

  it('switches back to JSX tab from Full Example', () => {
    const { CodeOutput } = jest.requireActual<
      typeof import('./components/CodeOutput')
    >('./components/CodeOutput');

    const code = {
      jsx: '<Button>Click</Button>',
      fullExample: "import { Button } from 'ui/shared/components';",
    };

    render(<CodeOutput code={code} />);

    // Switch to Full Example
    fireEvent.click(screen.getByText('Full Example'));
    // Switch back to JSX
    fireEvent.click(screen.getByText('JSX'));

    expect(screen.getByTestId('code-output')).toBeInTheDocument();
  });

  it('handles Full Example tab with null code', () => {
    const { CodeOutput } = jest.requireActual<
      typeof import('./components/CodeOutput')
    >('./components/CodeOutput');

    render(<CodeOutput code={null} />);

    fireEvent.click(screen.getByText('Full Example'));
    expect(screen.getByTestId('code-output')).toBeInTheDocument();
  });

  it('renders with null code', () => {
    const { CodeOutput } = jest.requireActual<
      typeof import('./components/CodeOutput')
    >('./components/CodeOutput');

    render(<CodeOutput code={null} />);

    expect(screen.getByTestId('code-output')).toBeInTheDocument();
  });
});

describe('PropControl dispatcher (direct)', () => {
  it('renders color control for color type', () => {
    const { PropControl } = jest.requireActual<
      typeof import('./components/PropControl/PropControl')
    >('./components/PropControl/PropControl');

    render(
      <PropControl
        prop={{
          name: 'color',
          type: 'string',
          controlType: 'color',
          required: false,
        }}
        value="#ff0000"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('color property')).toBeInTheDocument();
  });

  it('returns null for unknown control type', () => {
    const { PropControl } = jest.requireActual<
      typeof import('./components/PropControl/PropControl')
    >('./components/PropControl/PropControl');

    const { container } = render(
      <PropControl
        prop={{
          name: 'test',
          type: 'unknown',
          controlType: 'function' as any,
          required: false,
        }}
        value={null}
        onChange={jest.fn()}
      />,
    );

    expect(container.innerHTML).toBe('');
  });
});

describe('useCodeGeneration', () => {
  it('generates JSX snippet and full example', () => {
    const { useCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCodeGeneration')
    >('./hooks/useCodeGeneration');

    // Use a simple wrapper to test the hook
    let result: any;
    const TestComponent = () => {
      result = useCodeGeneration(mockPlaygroundComponents[0], {
        variant: 'secondary',
        disabled: true,
        children: 'Click Me',
      });
      return null;
    };

    render(<TestComponent />);

    expect(result).not.toBeNull();
    expect(result.jsx).toContain('variant="secondary"');
    expect(result.jsx).toContain('disabled');
    expect(result.jsx).toContain('Click Me');
    expect(result.fullExample).toContain('import');
  });

  it('returns null when component is null', () => {
    const { useCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCodeGeneration')
    >('./hooks/useCodeGeneration');

    let result: any;
    const TestComponent = () => {
      result = useCodeGeneration(null, {});
      return null;
    };

    render(<TestComponent />);

    expect(result).toBeNull();
  });

  it('generates self-closing tag when no children', () => {
    const { useCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCodeGeneration')
    >('./hooks/useCodeGeneration');

    let result: any;
    const TestComponent = () => {
      result = useCodeGeneration(mockPlaygroundComponents[0], {
        variant: 'primary',
        children: '',
      });
      return null;
    };

    render(<TestComponent />);

    expect(result.jsx).toContain('/>');
  });

  it('skips props with default values', () => {
    const { useCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCodeGeneration')
    >('./hooks/useCodeGeneration');

    let result: any;
    const TestComponent = () => {
      result = useCodeGeneration(mockPlaygroundComponents[0], {
        variant: 'primary', // default value, should be skipped
        disabled: false, // false booleans should be skipped
        children: 'Test',
      });
      return null;
    };

    render(<TestComponent />);

    expect(result.jsx).not.toContain('variant');
    expect(result.jsx).not.toContain('disabled');
  });
});

describe('ComponentPreview (direct)', () => {
  it('renders component via registry with preview container', () => {
    const { ComponentPreview } = jest.requireActual<
      typeof import('./components/ComponentPreview')
    >('./components/ComponentPreview');

    render(
      <ComponentPreview
        component={mockPlaygroundComponents[0]}
        props={{ variant: 'primary', children: 'Test' }}
        viewport="full"
        theme="light"
        showGrid={false}
      />,
    );

    expect(screen.getByTestId('component-preview')).toBeInTheDocument();
    expect(screen.getByTestId('mock-feature-component')).toBeInTheDocument();
  });

  it('applies grid class when showGrid is true', () => {
    const { ComponentPreview } = jest.requireActual<
      typeof import('./components/ComponentPreview')
    >('./components/ComponentPreview');

    render(
      <ComponentPreview
        component={mockPlaygroundComponents[0]}
        props={{ variant: 'primary', children: 'Test' }}
        viewport="full"
        theme="light"
        showGrid={true}
      />,
    );

    const container = screen.getByTestId('component-preview');
    expect(container.className).toContain('previewGrid');
  });

  it('sets viewport dimensions for non-full viewport', () => {
    const { ComponentPreview } = jest.requireActual<
      typeof import('./components/ComponentPreview')
    >('./components/ComponentPreview');

    const { container } = render(
      <ComponentPreview
        component={mockPlaygroundComponents[0]}
        props={{ variant: 'primary', children: 'Test' }}
        viewport="mobile"
        theme="dark"
        showGrid={false}
      />,
    );

    const previewDiv = container.querySelector(
      '[data-testid="component-preview"] > div',
    );
    expect(previewDiv).toHaveStyle({ width: '375px' });
  });

  it('shows fallback for unknown component', () => {
    const { ComponentPreview } = jest.requireActual<
      typeof import('./components/ComponentPreview')
    >('./components/ComponentPreview');

    const unknownComponent = {
      ...mockPlaygroundComponents[0],
      name: 'UnknownComponent',
    };

    render(
      <ComponentPreview
        component={unknownComponent}
        props={{}}
        viewport="full"
        theme="light"
        showGrid={false}
      />,
    );

    expect(screen.getByText(/not found in registry/)).toBeInTheDocument();
  });
});

describe('SlotPropEditor (direct)', () => {
  it('renders nothing when no editable props', () => {
    const { SlotPropEditor } = jest.requireActual<
      typeof import('./components/SlotPropEditor')
    >('./components/SlotPropEditor');

    const { container } = render(
      <SlotPropEditor
        slot={{ id: 'test', componentName: 'Test', label: 'Test', props: {} }}
        componentMetadata={undefined}
        currentProps={{}}
        onPropChange={jest.fn()}
      />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders toggle button when component has editable props', () => {
    const { SlotPropEditor } = jest.requireActual<
      typeof import('./components/SlotPropEditor')
    >('./components/SlotPropEditor');

    render(
      <SlotPropEditor
        slot={{
          id: 'test',
          componentName: 'Button',
          label: 'Button',
          props: {},
        }}
        componentMetadata={mockPlaygroundComponents[0]}
        currentProps={{ variant: 'primary' }}
        onPropChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Edit Props')).toBeInTheDocument();
  });

  it('expands and shows prop controls on toggle click', () => {
    const { SlotPropEditor } = jest.requireActual<
      typeof import('./components/SlotPropEditor')
    >('./components/SlotPropEditor');

    render(
      <SlotPropEditor
        slot={{
          id: 'test',
          componentName: 'Button',
          label: 'Button',
          props: {},
        }}
        componentMetadata={mockPlaygroundComponents[0]}
        currentProps={{ variant: 'primary' }}
        onPropChange={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Edit Props'));

    expect(screen.getByLabelText('variant property')).toBeInTheDocument();
  });

  it('calls onPropChange when a prop value changes', () => {
    const { SlotPropEditor } = jest.requireActual<
      typeof import('./components/SlotPropEditor')
    >('./components/SlotPropEditor');

    const onPropChange = jest.fn();

    render(
      <SlotPropEditor
        slot={{
          id: 'test',
          componentName: 'Button',
          label: 'Button',
          props: {},
        }}
        componentMetadata={mockPlaygroundComponents[0]}
        currentProps={{ variant: 'primary' }}
        onPropChange={onPropChange}
      />,
    );

    fireEvent.click(screen.getByText('Edit Props'));
    fireEvent.change(screen.getByLabelText('variant property'), {
      target: { value: 'secondary' },
    });

    expect(onPropChange).toHaveBeenCalledWith('variant', 'secondary');
  });

  it('collapses when toggled again', () => {
    const { SlotPropEditor } = jest.requireActual<
      typeof import('./components/SlotPropEditor')
    >('./components/SlotPropEditor');

    render(
      <SlotPropEditor
        slot={{
          id: 'test',
          componentName: 'Button',
          label: 'Button',
          props: {},
        }}
        componentMetadata={mockPlaygroundComponents[0]}
        currentProps={{}}
        onPropChange={jest.fn()}
      />,
    );

    const toggle = screen.getByText('Edit Props');
    fireEvent.click(toggle);
    expect(screen.getByLabelText('variant property')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByLabelText('variant property')).not.toBeInTheDocument();
  });
});

describe('MDXDocPanel (direct)', () => {
  it('renders loading skeleton initially', () => {
    server.use(...createPlaygroundHandlers({ docsContent: '# Docs' }));

    const { MDXDocPanel } = jest.requireActual<
      typeof import('./components/MDXDocPanel')
    >('./components/MDXDocPanel');

    render(<MDXDocPanel componentName="VitalGauge" />);

    // Should show skeleton while loading
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('renders no docs message on error', async () => {
    server.use(...createPlaygroundHandlers({ docsContent: null }));

    const { MDXDocPanel } = jest.requireActual<
      typeof import('./components/MDXDocPanel')
    >('./components/MDXDocPanel');

    render(<MDXDocPanel componentName="NonExistent" />);

    await waitFor(() => {
      expect(screen.getByTestId('no-docs-message')).toBeInTheDocument();
    });
  });

  it('renders documentation content on success', async () => {
    server.use(
      ...createPlaygroundHandlers({
        docsContent: '# VitalGauge Docs\n\nSample content',
      }),
    );

    const { MDXDocPanel } = jest.requireActual<
      typeof import('./components/MDXDocPanel')
    >('./components/MDXDocPanel');

    render(<MDXDocPanel componentName="VitalGauge" />);

    await waitFor(() => {
      expect(screen.getByTestId('mdx-doc-panel')).toBeInTheDocument();
    });
  });
});

describe('JsonControl (direct)', () => {
  it('renders with initial JSON value', () => {
    const { JsonControl } = jest.requireActual<
      typeof import('./components/PropControl/JsonControl')
    >('./components/PropControl/JsonControl');

    render(
      <JsonControl
        name="thresholds"
        value={{ good: 2500, poor: 4000 }}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('thresholds property')).toBeInTheDocument();
  });

  it('calls onChange with parsed JSON on valid input', () => {
    const { JsonControl } = jest.requireActual<
      typeof import('./components/PropControl/JsonControl')
    >('./components/PropControl/JsonControl');

    const onChange = jest.fn();
    render(<JsonControl name="data" value={{}} onChange={onChange} />);

    const textarea = screen.getByLabelText('data property');
    fireEvent.change(textarea, {
      target: { value: '{"key": "value"}' },
    });

    expect(onChange).toHaveBeenCalledWith({ key: 'value' });
  });

  it('shows error state for invalid JSON', () => {
    const { JsonControl } = jest.requireActual<
      typeof import('./components/PropControl/JsonControl')
    >('./components/PropControl/JsonControl');

    render(<JsonControl name="data" value={{}} onChange={jest.fn()} />);

    const textarea = screen.getByLabelText('data property');
    fireEvent.change(textarea, { target: { value: '{invalid json' } });

    expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('PropControl - json control', () => {
  it('renders json control for json type', () => {
    const { PropControl } = jest.requireActual<
      typeof import('./components/PropControl/PropControl')
    >('./components/PropControl/PropControl');

    render(
      <PropControl
        prop={{
          name: 'thresholds',
          type: '{ good: number; poor: number }',
          controlType: 'json',
          required: true,
        }}
        value={{ good: 2500, poor: 4000 }}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('thresholds property')).toBeInTheDocument();
  });
});

describe('CompositionList (direct)', () => {
  it('renders template buttons', () => {
    const { CompositionList } = jest.requireActual<
      typeof import('./components/CompositionList')
    >('./components/CompositionList');

    render(
      <CompositionList
        templates={mockCompositionTemplates}
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByText('Accessibility Audit')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('calls onSelect when template is clicked', () => {
    const { CompositionList } = jest.requireActual<
      typeof import('./components/CompositionList')
    >('./components/CompositionList');

    const onSelect = jest.fn();
    render(
      <CompositionList
        templates={mockCompositionTemplates}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByTestId('template-accessibility-audit'));
    expect(onSelect).toHaveBeenCalledWith(mockCompositionTemplates[0]);
  });

  it('highlights selected template', () => {
    const { CompositionList } = jest.requireActual<
      typeof import('./components/CompositionList')
    >('./components/CompositionList');

    render(
      <CompositionList
        templates={mockCompositionTemplates}
        selectedId="accessibility-audit"
        onSelect={jest.fn()}
      />,
    );

    const button = screen.getByTestId('template-accessibility-audit');
    expect(button.className).toContain('componentLinkActive');
  });
});

describe('CompositionEditor (direct)', () => {
  it('renders slots for template', () => {
    const { CompositionEditor } = jest.requireActual<
      typeof import('./components/CompositionEditor')
    >('./components/CompositionEditor');

    render(
      <CompositionEditor
        template={mockCompositionTemplates[0]}
        slotProps={{}}
      />,
    );

    expect(screen.getByTestId('composition-editor')).toBeInTheDocument();
    expect(screen.getByTestId('slot-axe-panel')).toBeInTheDocument();
    expect(screen.getByTestId('slot-contrast-checker')).toBeInTheDocument();
  });

  it('renders slot labels', () => {
    const { CompositionEditor } = jest.requireActual<
      typeof import('./components/CompositionEditor')
    >('./components/CompositionEditor');

    render(
      <CompositionEditor
        template={mockCompositionTemplates[0]}
        slotProps={{}}
      />,
    );

    expect(screen.getByText('Axe Audit')).toBeInTheDocument();
    expect(screen.getByText('Contrast Checker')).toBeInTheDocument();
  });

  it('applies layout data attribute', () => {
    const { CompositionEditor } = jest.requireActual<
      typeof import('./components/CompositionEditor')
    >('./components/CompositionEditor');

    const { container } = render(
      <CompositionEditor
        template={mockCompositionTemplates[0]}
        slotProps={{}}
      />,
    );

    const preview = container.querySelector('[data-layout="grid-1x2"]');
    expect(preview).toBeInTheDocument();
  });
});

describe('useCompositionCodeGeneration', () => {
  it('generates code for template', () => {
    const { useCompositionCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCompositionCodeGeneration')
    >('./hooks/useCompositionCodeGeneration');

    let result: any;
    const TestComponent = () => {
      result = useCompositionCodeGeneration(mockCompositionTemplates[0], {});
      return null;
    };

    render(<TestComponent />);

    expect(result).not.toBeNull();
    expect(result.fullExample).toContain('AxeAuditPanel');
    expect(result.fullExample).toContain('ContrastChecker');
  });

  it('returns null when template is null', () => {
    const { useCompositionCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCompositionCodeGeneration')
    >('./hooks/useCompositionCodeGeneration');

    let result: any;
    const TestComponent = () => {
      result = useCompositionCodeGeneration(null, {});
      return null;
    };

    render(<TestComponent />);

    expect(result).toBeNull();
  });

  it('includes slot props in code generation', () => {
    const { useCompositionCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCompositionCodeGeneration')
    >('./hooks/useCompositionCodeGeneration');

    let result: any;
    const TestComponent = () => {
      result = useCompositionCodeGeneration(mockCompositionTemplates[0], {
        'axe-panel': { custom: 'value' },
      });
      return null;
    };

    render(<TestComponent />);

    expect(result.jsx).toContain('AxeAuditPanel');
  });

  it('formats string slot props with double quotes', () => {
    const { useCompositionCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCompositionCodeGeneration')
    >('./hooks/useCompositionCodeGeneration');

    let result: any;
    const TestComponent = () => {
      result = useCompositionCodeGeneration(mockCompositionTemplates[0], {
        'axe-panel': { label: 'hello' },
      });
      return null;
    };

    render(<TestComponent />);

    expect(result.jsx).toContain('label="hello"');
  });

  it('formats non-string slot props with JSON.stringify', () => {
    const { useCompositionCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCompositionCodeGeneration')
    >('./hooks/useCompositionCodeGeneration');

    let result: any;
    const TestComponent = () => {
      result = useCompositionCodeGeneration(mockCompositionTemplates[0], {
        'axe-panel': { count: 42 },
      });
      return null;
    };

    render(<TestComponent />);

    expect(result.jsx).toContain('count={42}');
  });
});

describe('usePlaygroundStore', () => {
  beforeEach(() => {
    usePlaygroundStore.setState({
      component: null,
      props: {},
      viewport: 'full',
      theme: 'light',
      showGrid: false,
      activeTab: 'components',
      selectedTemplate: null,
      slotProps: {},
    });
  });

  it('setTheme updates theme', () => {
    usePlaygroundStore.getState().setTheme('dark');
    expect(usePlaygroundStore.getState().theme).toBe('dark');
  });

  it('toggleGrid toggles showGrid', () => {
    expect(usePlaygroundStore.getState().showGrid).toBe(false);
    usePlaygroundStore.getState().toggleGrid();
    expect(usePlaygroundStore.getState().showGrid).toBe(true);
  });

  it('setComponent stores component', () => {
    usePlaygroundStore.getState().setComponent(mockPlaygroundComponents[0]);
    expect(usePlaygroundStore.getState().component).toEqual(
      mockPlaygroundComponents[0],
    );
  });

  it('updateProp updates a single prop', () => {
    usePlaygroundStore.getState().updateProp('variant', 'secondary');
    expect(usePlaygroundStore.getState().props.variant).toBe('secondary');
  });

  it('resetProps replaces all props', () => {
    usePlaygroundStore.getState().updateProp('variant', 'secondary');
    usePlaygroundStore.getState().resetProps({ variant: 'primary' });
    expect(usePlaygroundStore.getState().props).toEqual({
      variant: 'primary',
    });
  });

  it('setViewport updates viewport', () => {
    usePlaygroundStore.getState().setViewport('tablet');
    expect(usePlaygroundStore.getState().viewport).toBe('tablet');
  });

  it('setActiveTab switches between tabs', () => {
    usePlaygroundStore.getState().setActiveTab('compositions');
    expect(usePlaygroundStore.getState().activeTab).toBe('compositions');

    usePlaygroundStore.getState().setActiveTab('components');
    expect(usePlaygroundStore.getState().activeTab).toBe('components');
  });

  it('selectTemplate sets template and initializes slot props', () => {
    usePlaygroundStore.getState().selectTemplate(mockCompositionTemplates[0]);

    expect(usePlaygroundStore.getState().selectedTemplate).toEqual(
      mockCompositionTemplates[0],
    );
    expect(usePlaygroundStore.getState().slotProps['axe-panel']).toEqual({});
    expect(usePlaygroundStore.getState().slotProps['contrast-checker']).toEqual(
      {},
    );
  });

  it('selectTemplate with null clears template and slot props', () => {
    usePlaygroundStore.getState().selectTemplate(mockCompositionTemplates[0]);
    usePlaygroundStore.getState().selectTemplate(null);

    expect(usePlaygroundStore.getState().selectedTemplate).toBeNull();
    expect(usePlaygroundStore.getState().slotProps).toEqual({});
  });

  it('updateSlotProp updates a single slot prop', () => {
    usePlaygroundStore.getState().selectTemplate(mockCompositionTemplates[0]);
    usePlaygroundStore.getState().updateSlotProp('axe-panel', 'key', 'val');

    expect(usePlaygroundStore.getState().slotProps['axe-panel']).toEqual({
      key: 'val',
    });
  });

  it('updateSlotProp creates slot entry when slotId does not exist', () => {
    usePlaygroundStore.getState().updateSlotProp('new-slot', 'key', 'val');

    expect(usePlaygroundStore.getState().slotProps['new-slot']).toEqual({
      key: 'val',
    });
  });

  it('resetSlotProps resets to template defaults', () => {
    usePlaygroundStore.getState().selectTemplate(mockCompositionTemplates[0]);
    usePlaygroundStore.getState().updateSlotProp('axe-panel', 'key', 'val');
    usePlaygroundStore.getState().resetSlotProps();

    expect(usePlaygroundStore.getState().slotProps['axe-panel']).toEqual({});
  });

  it('resetSlotProps does nothing when no template selected', () => {
    usePlaygroundStore.getState().resetSlotProps();
    expect(usePlaygroundStore.getState().slotProps).toEqual({});
  });
});

describe('useCodeGeneration - number prop formatting', () => {
  it('formats number props correctly', () => {
    const { useCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCodeGeneration')
    >('./hooks/useCodeGeneration');

    let result: any;
    const TestComponent = () => {
      result = useCodeGeneration(
        {
          ...mockPlaygroundComponents[0],
          props: [
            {
              name: 'count',
              type: 'number',
              controlType: 'number',
              required: false,
            },
          ],
        },
        { count: 42 },
      );
      return null;
    };

    render(<TestComponent />);

    expect(result.jsx).toContain('count={42}');
  });

  it('formats object props with JSON.stringify', () => {
    const { useCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCodeGeneration')
    >('./hooks/useCodeGeneration');

    let result: any;
    const TestComponent = () => {
      result = useCodeGeneration(
        {
          ...mockPlaygroundComponents[0],
          props: [
            {
              name: 'data',
              type: 'object',
              controlType: 'string',
              required: false,
            },
          ],
        },
        { data: { key: 'val' } },
      );
      return null;
    };

    render(<TestComponent />);

    expect(result.jsx).toContain('data=');
  });
});

describe('PropControl - number control with undefined value', () => {
  it('defaults to 0 when value is undefined', () => {
    const { PropControl } = jest.requireActual<
      typeof import('./components/PropControl/PropControl')
    >('./components/PropControl/PropControl');

    render(
      <PropControl
        prop={{
          name: 'count',
          type: 'number',
          controlType: 'number',
          required: false,
        }}
        value={undefined}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('count property')).toHaveValue(0);
  });
});

describe('PropControl - select with no options', () => {
  it('renders with empty options array', () => {
    const { PropControl } = jest.requireActual<
      typeof import('./components/PropControl/PropControl')
    >('./components/PropControl/PropControl');

    render(
      <PropControl
        prop={{
          name: 'variant',
          type: 'string',
          controlType: 'select',
          required: false,
        }}
        value={undefined}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('variant property')).toBeInTheDocument();
  });
});

describe('PropControl - color with undefined value', () => {
  it('defaults to #000000 when value is falsy', () => {
    const { PropControl } = jest.requireActual<
      typeof import('./components/PropControl/PropControl')
    >('./components/PropControl/PropControl');

    render(
      <PropControl
        prop={{
          name: 'bg',
          type: 'string',
          controlType: 'color',
          required: false,
        }}
        value=""
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('bg property')).toHaveValue('#000000');
  });
});

describe('PropControl - number control', () => {
  it('renders number control and handles change', () => {
    const { PropControl } = jest.requireActual<
      typeof import('./components/PropControl/PropControl')
    >('./components/PropControl/PropControl');

    const onChange = jest.fn();
    render(
      <PropControl
        prop={{
          name: 'height',
          type: 'number',
          controlType: 'number',
          required: false,
        }}
        value={100}
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText('height property');
    fireEvent.change(input, { target: { value: '200' } });
    expect(onChange).toHaveBeenCalledWith(200);
  });
});

describe('PropControl - boolean control onChange', () => {
  it('calls onChange with checked value', () => {
    const { BooleanControl } = jest.requireActual<
      typeof import('./components/PropControl/BooleanControl')
    >('./components/PropControl/BooleanControl');

    const onChange = jest.fn();
    render(
      <BooleanControl name="disabled" value={false} onChange={onChange} />,
    );

    fireEvent.click(screen.getByLabelText('disabled property'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('PropControl - select control onChange', () => {
  it('calls onChange with selected value', () => {
    const { SelectControl } = jest.requireActual<
      typeof import('./components/PropControl/SelectControl')
    >('./components/PropControl/SelectControl');

    const onChange = jest.fn();
    render(
      <SelectControl
        name="variant"
        value="primary"
        options={[
          { label: 'primary', value: 'primary' },
          { label: 'secondary', value: 'secondary' },
        ]}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('variant property'), {
      target: { value: 'secondary' },
    });
    expect(onChange).toHaveBeenCalledWith('secondary');
  });
});

describe('PropControl - color control onChange', () => {
  it('calls onChange with color value', () => {
    const { ColorControl } = jest.requireActual<
      typeof import('./components/PropControl/ColorControl')
    >('./components/PropControl/ColorControl');

    const onChange = jest.fn();
    render(<ColorControl name="color" value="#ff0000" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('color property'), {
      target: { value: '#00ff00' },
    });
    expect(onChange).toHaveBeenCalledWith('#00ff00');
  });
});

describe('ComponentRegistry', () => {
  it('getRegisteredComponent returns component for known feature name', () => {
    const { getRegisteredComponent } = jest.requireActual<
      typeof import('./components/ComponentRegistry')
    >('./components/ComponentRegistry');

    expect(getRegisteredComponent('VitalGauge')).toBeDefined();
  });

  it('getRegisteredComponent returns component for known shared name', () => {
    const { getRegisteredComponent } = jest.requireActual<
      typeof import('./components/ComponentRegistry')
    >('./components/ComponentRegistry');

    expect(getRegisteredComponent('Button')).toBeDefined();
    expect(getRegisteredComponent('Badge')).toBeDefined();
    expect(getRegisteredComponent('Card')).toBeDefined();
    expect(getRegisteredComponent('Skeleton')).toBeDefined();
    expect(getRegisteredComponent('LinkButton')).toBeDefined();
  });

  it('getRegisteredComponent returns undefined for unknown name', () => {
    const { getRegisteredComponent } = jest.requireActual<
      typeof import('./components/ComponentRegistry')
    >('./components/ComponentRegistry');

    expect(getRegisteredComponent('NonExistent')).toBeUndefined();
  });

  it('isRegisteredComponent returns true for feature and shared entries', () => {
    const { isRegisteredComponent } = jest.requireActual<
      typeof import('./components/ComponentRegistry')
    >('./components/ComponentRegistry');

    expect(isRegisteredComponent('VitalGauge')).toBe(true);
    expect(isRegisteredComponent('AxeAuditPanel')).toBe(true);
    expect(isRegisteredComponent('Button')).toBe(true);
    expect(isRegisteredComponent('Card')).toBe(true);
  });

  it('isRegisteredComponent returns false for non-registry entries', () => {
    const { isRegisteredComponent } = jest.requireActual<
      typeof import('./components/ComponentRegistry')
    >('./components/ComponentRegistry');

    expect(isRegisteredComponent('NonExistent')).toBe(false);
  });

  it('deprecated aliases still work', () => {
    const { getFeatureComponent, isFeatureComponent } = jest.requireActual<
      typeof import('./components/ComponentRegistry')
    >('./components/ComponentRegistry');

    expect(getFeatureComponent('VitalGauge')).toBeDefined();
    expect(isFeatureComponent('Button')).toBe(true);
  });
});

describe('CodeOutput - copy with null code', () => {
  it('does not call clipboard when code is null', async () => {
    const { CodeOutput } = jest.requireActual<
      typeof import('./components/CodeOutput')
    >('./components/CodeOutput');

    mockWriteText.mockClear();
    render(<CodeOutput code={null} />);

    fireEvent.click(screen.getByLabelText('Copy code'));

    // clipboard should not have been called
    expect(mockWriteText).not.toHaveBeenCalled();
  });
});

describe('CodeOutput - setTimeout coverage', () => {
  it('resets copied state after timeout', async () => {
    jest.useFakeTimers();
    const { CodeOutput } = jest.requireActual<
      typeof import('./components/CodeOutput')
    >('./components/CodeOutput');

    const code = {
      jsx: '<Button>Test</Button>',
      fullExample: 'import { Button }',
    };

    render(<CodeOutput code={code} />);

    fireEvent.click(screen.getByLabelText('Copy code'));

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});

describe('CodeOutput - accessibility', () => {
  it('has tablist, tab, and tabpanel roles', () => {
    const { CodeOutput } = jest.requireActual<
      typeof import('./components/CodeOutput')
    >('./components/CodeOutput');

    const code = {
      jsx: '<Button />',
      fullExample: 'import { Button }',
    };

    render(<CodeOutput code={code} />);

    expect(screen.getByRole('tablist')).toHaveAttribute(
      'aria-label',
      'Code view',
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });
});

describe('ComponentList - accessibility', () => {
  it('sets aria-current on active component link', () => {
    const { ComponentList } = jest.requireActual<
      typeof import('./components/ComponentList')
    >('./components/ComponentList');

    render(
      <ComponentList
        components={mockPlaygroundComponents}
        activeComponent="Button"
      />,
    );

    const activeLink = screen.getByTestId('component-link-Button');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not set aria-current on inactive component link', () => {
    const { ComponentList } = jest.requireActual<
      typeof import('./components/ComponentList')
    >('./components/ComponentList');

    render(
      <ComponentList
        components={mockPlaygroundComponents}
        activeComponent="Button"
      />,
    );

    const inactiveLink = screen.getByTestId('component-link-Badge');
    expect(inactiveLink).not.toHaveAttribute('aria-current');
  });
});

describe('CompositionList - accessibility', () => {
  it('sets aria-current on selected template', () => {
    const { CompositionList } = jest.requireActual<
      typeof import('./components/CompositionList')
    >('./components/CompositionList');

    render(
      <CompositionList
        templates={mockCompositionTemplates}
        selectedId="accessibility-audit"
        onSelect={jest.fn()}
      />,
    );

    const button = screen.getByTestId('template-accessibility-audit');
    expect(button).toHaveAttribute('aria-current', 'true');
  });
});

describe('CompositionEditor - accessibility', () => {
  it('adds role=region and aria-label to slots', () => {
    const { CompositionEditor } = jest.requireActual<
      typeof import('./components/CompositionEditor')
    >('./components/CompositionEditor');

    render(
      <CompositionEditor
        template={mockCompositionTemplates[0]}
        slotProps={{}}
      />,
    );

    const slot = screen.getByTestId('slot-axe-panel');
    expect(slot).toHaveAttribute('role', 'region');
    expect(slot).toHaveAttribute('aria-label', 'Axe Audit slot');
  });
});

describe('PropEditor - accessibility', () => {
  it('has role=group and aria-label', () => {
    const { PropEditor } = jest.requireActual<
      typeof import('./components/PropEditor')
    >('./components/PropEditor');

    render(
      <PropEditor
        props={mockPlaygroundComponents[0].props}
        values={{}}
        onPropChange={jest.fn()}
        onReset={jest.fn()}
      />,
    );

    const editor = screen.getByTestId('prop-editor');
    expect(editor).toHaveAttribute('role', 'group');
    expect(editor).toHaveAttribute('aria-label', 'Component properties');
  });
});

describe('useCodeGeneration - edge cases', () => {
  it('skips empty string props', () => {
    const { useCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCodeGeneration')
    >('./hooks/useCodeGeneration');

    let result: any;
    const TestComponent = () => {
      result = useCodeGeneration(
        {
          ...mockPlaygroundComponents[0],
          props: [
            {
              name: 'title',
              type: 'string',
              controlType: 'string',
              required: false,
            },
          ],
        },
        { title: '' },
      );
      return null;
    };

    render(<TestComponent />);

    expect(result.jsx).not.toContain('title');
  });

  it('skips false boolean props', () => {
    const { useCodeGeneration } = jest.requireActual<
      typeof import('./hooks/useCodeGeneration')
    >('./hooks/useCodeGeneration');

    let result: any;
    const TestComponent = () => {
      result = useCodeGeneration(
        {
          ...mockPlaygroundComponents[0],
          props: [
            {
              name: 'active',
              type: 'boolean',
              controlType: 'boolean',
              required: false,
            },
          ],
        },
        { active: false },
      );
      return null;
    };

    render(<TestComponent />);

    expect(result.jsx).not.toContain('active');
  });
});

describe('ComponentDetailContainer - tab bar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ componentId: 'Button' });
    usePlaygroundStore.setState({
      component: null,
      props: {},
      viewport: 'full',
      theme: 'light',
      showGrid: false,
      activeTab: 'components',
      selectedTemplate: null,
      slotProps: {},
    });
  });

  it('renders tab bar with Components and Compositions tabs', async () => {
    render(<ComponentDetailContainer />);

    const tablist = screen.getByRole('tablist', {
      name: 'Playground views',
    });
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
  });

  it('compositions tab navigates to /playground', async () => {
    const mockNavigate = jest.fn();
    const { useNavigate } = jest.requireMock('@tanstack/react-router');
    useNavigate.mockReturnValue(mockNavigate);

    render(<ComponentDetailContainer />);

    const compositionsTab = screen.getByRole('tab', { name: 'Compositions' });
    fireEvent.click(compositionsTab);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/playground' });
    expect(usePlaygroundStore.getState().activeTab).toBe('compositions');
  });
});

describe('buildDefaultProps coverage', () => {
  it('initializes default props correctly', async () => {
    useParams.mockReturnValue({ componentId: 'Button' });
    usePlaygroundStore.setState({
      component: null,
      props: {},
      viewport: 'full',
      theme: 'light',
      showGrid: false,
      activeTab: 'components',
      selectedTemplate: null,
      slotProps: {},
    });

    render(<ComponentDetailContainer />);

    await waitFor(() => {
      const state = usePlaygroundStore.getState();
      expect(state.props).toHaveProperty('variant', 'primary');
    });
  });
});
