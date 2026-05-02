// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { OlaminaDscrComponent } from '../src/Component';

describe('<OlaminaDscrComponent />', () => {
  it('renders the heading', () => {
    render(<OlaminaDscrComponent />);
    expect(screen.getByRole('heading', { name: /olamina dscr/i, level: 1 })).toBeInTheDocument();
  });

  it('renders the privacy disclosure (KTD #18)', () => {
    render(<OlaminaDscrComponent />);
    expect(screen.getByText(/Inputs don't leave your browser/i)).toBeInTheDocument();
  });

  it('exposes the kit-tier selector', () => {
    render(<OlaminaDscrComponent />);
    expect(screen.getByLabelText(/kit tier/i)).toBeInTheDocument();
  });

  it('switching kit tier updates the breakdown table header', async () => {
    render(<OlaminaDscrComponent />);
    const user = userEvent.setup();
    expect(screen.getByText(/Kit \(Plus\)/i)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/kit tier/i), 'max');
    expect(screen.getByText(/Kit \(Max\)/i)).toBeInTheDocument();
  });

  it('routes computed results through an aria-live region', () => {
    const { container } = render(<OlaminaDscrComponent />);
    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });

  it('clicking a preset updates the homes', async () => {
    render(<OlaminaDscrComponent />);
    const user = userEvent.setup();
    const presetE = screen.getByRole('button', { name: /7× montana/i });
    await user.click(presetE);
    const selects = screen.getAllByRole('combobox');
    const homeSelects = selects.filter((s) => (s as HTMLSelectElement).value === 'montana');
    expect(homeSelects.length).toBe(7);
  });
});
