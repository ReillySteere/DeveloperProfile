// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from 'ui/test-utils';
import axe from 'axe-core';

const mockAxeRun = axe.run as jest.Mock;

jest.mock('@tanstack/react-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    Link: ({ children, to, className }: any) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
    useLocation: jest.fn(() => ({ pathname: '/accessibility' })),
  };
});

import AccessibilityContainer from './accessibility.container';

describe('AccessibilityContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxeRun.mockResolvedValue({
      violations: [],
      passes: [{ id: 'button-name' } as axe.Result],
      incomplete: [],
      inapplicable: [],
      testEngine: { name: 'axe-core', version: '4.0' },
      testRunner: { name: 'axe' },
      testEnvironment: {} as axe.TestEnvironment,
      url: '',
      timestamp: '',
      toolOptions: {} as axe.RunOptions,
    });
  });

  it('renders heading and subtitle', () => {
    render(<AccessibilityContainer />);

    expect(screen.getByText('Accessibility Showcase')).toBeInTheDocument();
    expect(
      screen.getByText(
        'WCAG 2.1 AA compliance with interactive demonstrations',
      ),
    ).toBeInTheDocument();
  });

  it('renders all section titles', () => {
    render(<AccessibilityContainer />);

    expect(screen.getByText('Accessibility Audit')).toBeInTheDocument();
    expect(screen.getByText('Contrast Checker')).toBeInTheDocument();
    expect(screen.getByText('Landmark Regions')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Focus Tracker')).toBeInTheDocument();
    expect(screen.getByText('Screen Reader Simulator')).toBeInTheDocument();
    expect(screen.getByText('Focus Management')).toBeInTheDocument();
    expect(screen.getByText('ARIA Pattern Showcase')).toBeInTheDocument();
  });

  // AxeAuditPanel tests
  describe('AxeAuditPanel', () => {
    it('runs audit and displays score on click', async () => {
      render(<AccessibilityContainer />);

      const runButton = screen.getByText('Run Audit');
      await act(async () => {
        fireEvent.click(runButton);
      });

      await waitFor(() => {
        expect(screen.getByText('100/100')).toBeInTheDocument();
      });
      expect(screen.getByText('1 passed')).toBeInTheDocument();
      expect(screen.getByText('0 violations')).toBeInTheDocument();
    });

    it('displays violations when audit finds issues', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'color-contrast',
            impact: 'serious',
            description: 'Elements must have sufficient color contrast',
            help: 'Elements must have sufficient color contrast',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/color-contrast',
            nodes: [
              {
                html: '<p>test</p>',
                target: ['p.test'],
                failureSummary: 'Fix any of the following: Increase contrast',
              } as axe.NodeResult,
            ],
          } as unknown as axe.Result,
        ],
        passes: [
          { id: 'button-name' } as axe.Result,
          { id: 'image-alt' } as axe.Result,
        ],
        incomplete: [{ id: 'aria-input' } as axe.Result],
        inapplicable: [],
        testEngine: { name: 'axe-core', version: '4.0' },
        testRunner: { name: 'axe' },
        testEnvironment: {} as axe.TestEnvironment,
        url: '',
        timestamp: '',
        toolOptions: {} as axe.RunOptions,
      });

      render(<AccessibilityContainer />);

      await act(async () => {
        fireEvent.click(screen.getByText('Run Audit'));
      });

      await waitFor(() => {
        expect(screen.getByText('67/100')).toBeInTheDocument();
      });
      expect(screen.getByText('1 violations')).toBeInTheDocument();
      expect(screen.getByText('1 incomplete')).toBeInTheDocument();
      expect(screen.getByText('serious')).toBeInTheDocument();
      expect(
        screen.getByText('Elements must have sufficient color contrast'),
      ).toBeInTheDocument();
      expect(screen.getByText('1 element')).toBeInTheDocument();

      // Expand the violation to see details
      const expandButton = screen.getByRole('button', {
        name: /elements must have sufficient color contrast/i,
      });
      await act(async () => {
        fireEvent.click(expandButton);
      });

      // Check expanded content
      expect(screen.getByText('p.test')).toBeInTheDocument();
      expect(screen.getByText('<p>test</p>')).toBeInTheDocument();
      expect(screen.getByText('Learn more about this rule →')).toHaveAttribute(
        'href',
        'https://dequeuniversity.com/rules/axe/4.0/color-contrast',
      );
    });
  });

  // ContrastChecker tests
  describe('ContrastChecker', () => {
    it('renders color pairs with ratios and WCAG levels', () => {
      render(<AccessibilityContainer />);

      expect(screen.getByText('Primary Text')).toBeInTheDocument();
      expect(
        screen.getByText('Body text on light background'),
      ).toBeInTheDocument();
      // Check a ratio is rendered (black on white-ish should be high)
      const ratioCells = screen.getAllByText(/:1$/);
      expect(ratioCells.length).toBeGreaterThan(0);
    });

    it('renders WCAG level badges', () => {
      render(<AccessibilityContainer />);

      // Primary Text (#0f172a on #f8fafc) should have AAA for both normal and large
      const aaaBadges = screen.getAllByText('AAA');
      expect(aaaBadges.length).toBeGreaterThan(0);
    });
  });

  // KeyboardOverlay tests
  describe('KeyboardOverlay', () => {
    it('starts and stops tracking', () => {
      render(<AccessibilityContainer />);

      const startButton = screen.getByText('Start Tracking');
      fireEvent.click(startButton);

      expect(screen.getByText('Stop Tracking')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Press Tab to navigate through the page. Focus events will be recorded below.',
        ),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByText('Stop Tracking'));
      expect(screen.getByText('Start Tracking')).toBeInTheDocument();
    });

    it('records focus events when tracking', () => {
      render(<AccessibilityContainer />);

      fireEvent.click(screen.getByText('Start Tracking'));

      // Tab to an element
      const submitButton = screen.getByText('Submit');
      fireEvent.focusIn(submitButton);

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('<button>')).toBeInTheDocument();
    });

    it('clears history', () => {
      render(<AccessibilityContainer />);

      fireEvent.click(screen.getByText('Start Tracking'));
      fireEvent.focusIn(screen.getByText('Submit'));

      expect(screen.getByText('#1')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Clear'));

      expect(screen.queryByText('#1')).not.toBeInTheDocument();
    });
  });

  // ScreenReaderSimulator tests
  describe('ScreenReaderSimulator', () => {
    it('announces button on focus', () => {
      render(<AccessibilityContainer />);

      const submitButton = screen.getByText('Submit');
      fireEvent.focus(submitButton);

      expect(screen.getByRole('status')).toHaveTextContent(
        'button: Submit form',
      );
    });

    it('announces checkbox state', () => {
      render(<AccessibilityContainer />);

      const checkbox = screen.getByText('Accept terms');
      fireEvent.focus(checkbox);

      expect(screen.getByRole('status')).toHaveTextContent(
        'checkbox: Accept terms, not checked',
      );

      // Toggle checkbox
      fireEvent.click(checkbox);
      fireEvent.focus(checkbox);

      expect(screen.getByRole('status')).toHaveTextContent(
        'checkbox: Accept terms, checked',
      );
    });

    it('announces disabled state', () => {
      render(<AccessibilityContainer />);

      const disabledButton = screen.getByText('Delete (disabled)');
      fireEvent.focus(disabledButton);

      expect(screen.getByRole('status')).toHaveTextContent(
        'button: Delete account, dimmed',
      );
    });
  });

  // FocusManagementDemo tests
  describe('FocusManagementDemo', () => {
    it('renders skip link that becomes visible on focus', () => {
      render(<AccessibilityContainer />);

      const skipLink = screen.getByText('Skip to demo content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#demo-target');
    });

    it('activates and deactivates focus trap', () => {
      render(<AccessibilityContainer />);

      fireEvent.click(screen.getByText('Activate Trap'));
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Deactivate Trap'));
      expect(screen.queryByText('First')).not.toBeInTheDocument();
    });

    it('cycles focus within trap on Tab', () => {
      render(<AccessibilityContainer />);

      fireEvent.click(screen.getByText('Activate Trap'));

      const trap = screen.getByRole('dialog', {
        name: 'Focus trap demo',
      });
      const buttons = trap.querySelectorAll('button');
      const lastButton = buttons[buttons.length - 1];

      // Focus the last button and press Tab
      (lastButton as HTMLElement).focus();
      fireEvent.keyDown(trap, { key: 'Tab' });

      // First button should get focus
      expect(document.activeElement).toBe(buttons[0]);
    });

    it('cycles focus backward with Shift+Tab', () => {
      render(<AccessibilityContainer />);

      fireEvent.click(screen.getByText('Activate Trap'));

      const trap = screen.getByRole('dialog', {
        name: 'Focus trap demo',
      });
      const buttons = trap.querySelectorAll('button');
      const firstButton = buttons[0];

      // Focus the first button and press Shift+Tab
      (firstButton as HTMLElement).focus();
      fireEvent.keyDown(trap, { key: 'Tab', shiftKey: true });

      // Last button should get focus
      expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    });

    it('closes trap via Close Trap button', () => {
      render(<AccessibilityContainer />);

      fireEvent.click(screen.getByText('Activate Trap'));
      expect(screen.getByText('Close Trap')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close Trap'));
      expect(screen.queryByText('Close Trap')).not.toBeInTheDocument();
    });

    it('opens panel and restores focus on close', () => {
      render(<AccessibilityContainer />);

      const openButton = screen.getByText('Open Panel');
      fireEvent.click(openButton);

      expect(
        screen.getByText('Panel content with focus restoration.'),
      ).toBeInTheDocument();
      const closeButton = screen.getByText('Close Panel');
      expect(document.activeElement).toBe(closeButton);

      fireEvent.click(closeButton);

      expect(
        screen.queryByText('Panel content with focus restoration.'),
      ).not.toBeInTheDocument();
      expect(document.activeElement).toBe(openButton);
    });
  });

  // LandmarkVisualizer tests
  describe('LandmarkVisualizer', () => {
    it('renders detected landmarks', () => {
      render(<AccessibilityContainer />);

      // The container renders inside a <main> element via Frame
      // so at minimum we should see the main landmark
      const landmarkList = screen.getByLabelText('Page landmark regions');
      expect(landmarkList).toBeInTheDocument();
    });

    it('refresh button re-scans landmarks', () => {
      render(<AccessibilityContainer />);

      const refreshButton = screen.getAllByText('Refresh')[0];
      fireEvent.click(refreshButton);

      expect(
        screen.getByLabelText('Page landmark regions'),
      ).toBeInTheDocument();
    });
  });

  // ARIAPatternShowcase tests
  describe('ARIAPatternShowcase', () => {
    it('renders all pattern titles', () => {
      render(<AccessibilityContainer />);

      expect(
        screen.getByText('NavigationRail: aria-expanded'),
      ).toBeInTheDocument();
      expect(screen.getByText('Frame: Main Landmark')).toBeInTheDocument();
      expect(screen.getByText('Skeleton: Loading State')).toBeInTheDocument();
      expect(screen.getByText('Card: Semantic Element')).toBeInTheDocument();
    });

    it('renders code blocks for each pattern', () => {
      const { container } = render(<AccessibilityContainer />);

      const codeBlocks = container.querySelectorAll('pre code');
      expect(codeBlocks.length).toBe(4);
    });

    it('toggles aria-expanded demo', () => {
      render(<AccessibilityContainer />);

      const expandButton = screen.getByText('Expand');
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(expandButton);

      expect(screen.getByText('Collapse')).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      expect(
        screen.getByText('Navigation content visible'),
      ).toBeInTheDocument();
    });
  });
});

// Direct component tests for coverage of branches
describe('AxeAuditPanel - multiple violations display', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AxeAuditPanel } = require('./components/AxeAuditPanel');

  it('renders plural nodes text for multiple nodes', async () => {
    mockAxeRun.mockResolvedValue({
      violations: [
        {
          id: 'color-contrast',
          impact: 'critical',
          description: 'Insufficient contrast',
          help: 'Insufficient contrast',
          helpUrl: 'https://example.com',
          nodes: [
            { html: '<p>a</p>', target: ['p.a'] } as axe.NodeResult,
            { html: '<p>b</p>', target: ['p.b'] } as axe.NodeResult,
            { html: '<p>c</p>', target: ['p.c'] } as axe.NodeResult,
          ],
        } as unknown as axe.Result,
      ],
      passes: [],
      incomplete: [],
      inapplicable: [],
      testEngine: { name: 'axe-core', version: '4.0' },
      testRunner: { name: 'axe' },
      testEnvironment: {} as axe.TestEnvironment,
      url: '',
      timestamp: '',
      toolOptions: {} as axe.RunOptions,
    });

    render(<AxeAuditPanel />);

    await act(async () => {
      fireEvent.click(screen.getByText('Run Audit'));
    });

    await waitFor(() => {
      expect(screen.getByText('3 elements')).toBeInTheDocument();
    });
    expect(screen.getByText('critical')).toBeInTheDocument();
  });

  it('handles shadow DOM selectors (nested arrays) in target', async () => {
    mockAxeRun.mockResolvedValue({
      violations: [
        {
          id: 'color-contrast',
          impact: 'critical',
          description: 'Insufficient contrast',
          help: 'Insufficient contrast',
          helpUrl: 'https://example.com',
          nodes: [
            {
              html: '<p>shadow</p>',
              target: [['#shadow-host', 'p.inside']],
            } as unknown as axe.NodeResult,
          ],
        } as unknown as axe.Result,
      ],
      passes: [],
      incomplete: [],
      inapplicable: [],
      testEngine: { name: 'axe-core', version: '4.0' },
      testRunner: { name: 'axe' },
      testEnvironment: {} as axe.TestEnvironment,
      url: '',
      timestamp: '',
      toolOptions: {} as axe.RunOptions,
    });

    render(<AxeAuditPanel />);

    await act(async () => {
      fireEvent.click(screen.getByText('Run Audit'));
    });

    await waitFor(() => {
      expect(screen.getByText('1 element')).toBeInTheDocument();
    });

    // Expand to see the selector
    fireEvent.click(screen.getByRole('button', { expanded: false }));

    // Should join nested array correctly: ['#shadow-host', 'p.inside'] becomes "#shadow-host > p.inside"
    expect(screen.getByText('#shadow-host > p.inside')).toBeInTheDocument();
  });
});

describe('LandmarkVisualizer - empty state', () => {
  it('shows empty state when no landmarks', () => {
    // Remove all landmarks from DOM first
    const origQuerySelectorAll = document.querySelectorAll.bind(document);
    jest
      .spyOn(document, 'querySelectorAll')
      .mockImplementation((selector: string) => {
        if (selector.includes('main') || selector.includes('nav')) {
          return {
            forEach: jest.fn(),
            length: 0,
          } as unknown as NodeListOf<Element>;
        }
        return origQuerySelectorAll(selector);
      });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LandmarkVisualizer } = require('./components/LandmarkVisualizer');
    render(<LandmarkVisualizer />);

    expect(
      screen.getByText('No landmark regions detected.'),
    ).toBeInTheDocument();

    jest.restoreAllMocks();
  });
});

describe('ScreenReaderSimulator - link focus', () => {
  const { ScreenReaderSimulator } = jest.requireActual<
    typeof import('./components/ScreenReaderSimulator')
  >('./components/ScreenReaderSimulator');

  it('announces link on focus', () => {
    render(<ScreenReaderSimulator />);

    const docLink = screen.getByText('Documentation');
    fireEvent.focus(docLink);

    expect(screen.getByRole('status')).toHaveTextContent(
      'a: View documentation',
    );
  });
});

describe('KeyboardOverlay - role display', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { KeyboardOverlay } = require('./components/KeyboardOverlay');

  it('displays role when element has one', () => {
    render(<KeyboardOverlay />);

    fireEvent.click(screen.getByText('Start Tracking'));

    // Create and focus an element with a role
    const el = document.createElement('button');
    el.setAttribute('role', 'tab');
    el.textContent = 'Tab Button';
    document.body.appendChild(el);

    fireEvent.focusIn(el);

    expect(screen.getByText('role="tab"')).toBeInTheDocument();

    document.body.removeChild(el);
  });

  it('marks previous entries as not current when new focus occurs', () => {
    render(<KeyboardOverlay />);

    fireEvent.click(screen.getByText('Start Tracking'));

    const el1 = document.createElement('button');
    el1.textContent = 'First Button';
    document.body.appendChild(el1);

    const el2 = document.createElement('button');
    el2.textContent = 'Second Button';
    document.body.appendChild(el2);

    fireEvent.focusIn(el1);
    fireEvent.focusIn(el2);

    const entries = screen.getAllByRole('listitem');
    expect(entries[0]).not.toHaveAttribute('data-current');
    expect(entries[1]).toHaveAttribute('data-current', 'true');

    document.body.removeChild(el1);
    document.body.removeChild(el2);
  });
});

describe('ScreenReaderSimulator - expanded/collapsed and textContent', () => {
  const { ScreenReaderSimulator } = jest.requireActual<
    typeof import('./components/ScreenReaderSimulator')
  >('./components/ScreenReaderSimulator');

  it('announces collapsed state when aria-expanded is false', () => {
    render(<ScreenReaderSimulator />);

    const menuButton = screen.getByText('Menu');
    fireEvent.focus(menuButton);

    expect(screen.getByRole('status')).toHaveTextContent(
      'button: Toggle menu, collapsed',
    );
  });

  it('announces expanded state when aria-expanded is true', () => {
    render(<ScreenReaderSimulator />);

    const menuButton = screen.getByText('Menu');
    fireEvent.click(menuButton);
    fireEvent.focus(menuButton);

    expect(screen.getByRole('status')).toHaveTextContent(
      'button: Toggle menu, expanded',
    );
  });

  it('uses textContent when aria-label is missing', () => {
    render(<ScreenReaderSimulator />);

    const saveButton = screen.getByText('Save Draft');
    fireEvent.focus(saveButton);

    expect(screen.getByRole('status')).toHaveTextContent('button: Save Draft');
  });
});

describe('FocusManagementDemo - trap edge cases', () => {
  const { FocusManagementDemo } = jest.requireActual<
    typeof import('./components/FocusManagementDemo')
  >('./components/FocusManagementDemo');

  it('ignores non-Tab keys in focus trap', () => {
    render(<FocusManagementDemo />);

    fireEvent.click(screen.getByText('Activate Trap'));

    const trap = screen.getByRole('dialog', { name: 'Focus trap demo' });
    const buttons = trap.querySelectorAll('button');
    (buttons[0] as HTMLElement).focus();

    // Press a non-Tab key should not change focus
    fireEvent.keyDown(trap, { key: 'Enter' });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('does not cycle when Tab pressed in middle of trap', () => {
    render(<FocusManagementDemo />);

    fireEvent.click(screen.getByText('Activate Trap'));

    const trap = screen.getByRole('dialog', { name: 'Focus trap demo' });
    const buttons = trap.querySelectorAll('button');

    // Focus the second button (middle) and press Tab
    (buttons[1] as HTMLElement).focus();
    fireEvent.keyDown(trap, { key: 'Tab' });

    // Active element should still be the second button (no preventDefault)
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('does not cycle when Shift+Tab pressed in middle of trap', () => {
    render(<FocusManagementDemo />);

    fireEvent.click(screen.getByText('Activate Trap'));

    const trap = screen.getByRole('dialog', { name: 'Focus trap demo' });
    const buttons = trap.querySelectorAll('button');

    // Focus the second button and press Shift+Tab
    (buttons[1] as HTMLElement).focus();
    fireEvent.keyDown(trap, { key: 'Tab', shiftKey: true });

    // Should not wrap - still second button
    expect(document.activeElement).toBe(buttons[1]);
  });
});

describe('useLandmarks - element roles', () => {
  it('detects landmarks with explicit roles and labels', () => {
    // Add landmark elements to the DOM
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Main navigation');
    document.body.appendChild(nav);

    const aside = document.createElement('aside');
    document.body.appendChild(aside);

    const header = document.createElement('header');
    document.body.appendChild(header);

    const footer = document.createElement('footer');
    document.body.appendChild(footer);

    const region = document.createElement('div');
    region.setAttribute('role', 'region');
    region.setAttribute('aria-label', 'Custom region');
    document.body.appendChild(region);

    const search = document.createElement('div');
    search.setAttribute('role', 'search');
    document.body.appendChild(search);

    render(<AccessibilityContainer />);

    expect(screen.getByText('navigation')).toBeInTheDocument();
    expect(screen.getByText('complementary')).toBeInTheDocument();
    expect(screen.getByText('banner')).toBeInTheDocument();
    expect(screen.getByText('contentinfo')).toBeInTheDocument();
    expect(screen.getByText('region')).toBeInTheDocument();
    expect(screen.getByText('search')).toBeInTheDocument();
    expect(screen.getByText('"Main navigation"')).toBeInTheDocument();

    document.body.removeChild(nav);
    document.body.removeChild(aside);
    document.body.removeChild(header);
    document.body.removeChild(footer);
    document.body.removeChild(region);
    document.body.removeChild(search);
  });
});

describe('useFocusTracker - getElementLabel fallbacks', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { KeyboardOverlay } = require('./components/KeyboardOverlay');

  it('falls back to tagName when no aria-label or textContent', () => {
    render(<KeyboardOverlay />);

    fireEvent.click(screen.getByText('Start Tracking'));

    const el = document.createElement('input');
    el.type = 'text';
    document.body.appendChild(el);

    fireEvent.focusIn(el);

    expect(screen.getByText('input')).toBeInTheDocument();

    document.body.removeChild(el);
  });

  it('uses aria-labelledby when no aria-label', () => {
    render(<KeyboardOverlay />);

    fireEvent.click(screen.getByText('Start Tracking'));

    const label = document.createElement('span');
    label.id = 'test-label';
    label.textContent = 'Label text';
    document.body.appendChild(label);

    const el = document.createElement('button');
    el.setAttribute('aria-labelledby', 'test-label');
    document.body.appendChild(el);

    fireEvent.focusIn(el);

    expect(screen.getByText('test-label')).toBeInTheDocument();

    document.body.removeChild(el);
    document.body.removeChild(label);
  });
});
