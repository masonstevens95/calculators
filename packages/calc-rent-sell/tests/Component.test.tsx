// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RentSellComponent } from '../src/Component';

describe('<RentSellComponent />', () => {
  it('renders the heading', () => {
    render(<RentSellComponent />);
    expect(
      screen.getByRole('heading', { name: /rent vs sell/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('does NOT render a privacy disclosure (KTD #18 — analysis tool, not personal-loan input)', () => {
    render(<RentSellComponent />);
    expect(screen.queryByText(/Inputs don't leave your browser/i)).not.toBeInTheDocument();
  });

  it('renders all five inputs', () => {
    render(<RentSellComponent />);
    // "Monthly rent" exact match (a stat label also contains "rent" as substring)
    expect(screen.getByLabelText('Monthly rent')).toBeInTheDocument();
    expect(screen.getByLabelText(/management mode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/annual appreciation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/annual investment return/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/move-out year/i)).toBeInTheDocument();
  });

  it('renders all three charts with descriptive aria-labels', () => {
    render(<RentSellComponent />);
    expect(screen.getByRole('img', { name: /net cash flow vs monthly rent/i })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /net wealth: sell vs rent over 10 years/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /rent advantage at year 10 by home appreciation/i }),
    ).toBeInTheDocument();
  });

  it('renders the Section 121 timeline block', () => {
    render(<RentSellComponent />);
    expect(screen.getByRole('heading', { name: /section 121/i })).toBeInTheDocument();
  });

  it('routes results through aria-live', () => {
    const { container } = render(<RentSellComponent />);
    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });
});
