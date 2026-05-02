import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CalculatorsLoadError } from '../src/CalculatorsLoadError';

describe('<CalculatorsLoadError />', () => {
  it('renders a default friendly message when no error prop is supplied', () => {
    render(<CalculatorsLoadError />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/couldn't load the calculators/i)).toBeInTheDocument();
  });

  it('exposes a stable role="alert" the host can query', () => {
    const { container } = render(<CalculatorsLoadError />);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('surfaces a developer-readable detail when a string error is passed', () => {
    render(<CalculatorsLoadError error="net::ERR_FAILED loading remoteEntry.js" />);
    expect(screen.getByText(/net::ERR_FAILED loading remoteEntry\.js/)).toBeInTheDocument();
  });

  it('surfaces error.message when an Error instance is passed', () => {
    render(<CalculatorsLoadError error={new Error('boom from the host')} />);
    expect(screen.getByText(/boom from the host/)).toBeInTheDocument();
  });

  // KTD #5 sanitization contract — must escape, never inject HTML
  it('renders a string error containing markup as escaped text, never as DOM', () => {
    const malicious = '<script>alert(1)</script>';
    const { container } = render(<CalculatorsLoadError error={malicious} />);
    // Literal text node containing the angle brackets — NOT a <script> element
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain(malicious);
  });

  it('renders an Error.message containing markup as escaped text', () => {
    const malicious = new Error('<img src=x onerror="alert(1)">');
    const { container } = render(<CalculatorsLoadError error={malicious} />);
    // The injected <img> must not exist as a real element
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
  });

  it('falls back to String(error) for unknown shapes without throwing', () => {
    render(<CalculatorsLoadError error={{ code: 42, reason: 'weird' }} />);
    // Just assert it rendered something without throwing
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
