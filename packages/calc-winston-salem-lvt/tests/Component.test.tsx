// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WinstonSalemLvtComponent } from '../src/Component';

describe('<WinstonSalemLvtComponent />', () => {
  it('renders the heading', () => {
    render(<WinstonSalemLvtComponent />);
    expect(screen.getByRole('heading', { name: /winston-salem lvt/i, level: 1 })).toBeInTheDocument();
  });

  it('does NOT render a privacy disclosure (KTD #18 — I5 dropped from disclosure scope)', () => {
    render(<WinstonSalemLvtComponent />);
    expect(screen.queryByText(/Inputs don't leave your browser/i)).not.toBeInTheDocument();
  });

  it('renders the shift slider', () => {
    render(<WinstonSalemLvtComponent />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('renders the sample-parcel table with 7 rows', () => {
    render(<WinstonSalemLvtComponent />);
    const tables = screen.getAllByRole('table');
    const parcelTable = tables[0]!;
    expect(parcelTable.querySelectorAll('tbody tr')).toHaveLength(7);
  });

  it('renders the chart with an aria-label', () => {
    render(<WinstonSalemLvtComponent />);
    expect(
      screen.getByRole('img', { name: /annual tax by parcel/i }),
    ).toBeInTheDocument();
  });

  it('routes results through aria-live', () => {
    const { container } = render(<WinstonSalemLvtComponent />);
    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });

  it('renders the user-parcel inputs', () => {
    render(<WinstonSalemLvtComponent />);
    expect(screen.getByLabelText(/your land value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your improvement value/i)).toBeInTheDocument();
  });
});
