import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { FormField } from '../src/FormField';

describe('<FormField />', () => {
  it('associates the label with the input via htmlFor/id', () => {
    render(
      <FormField label="Loan amount">
        {({ id }) => <input id={id} type="text" />}
      </FormField>,
    );
    const input = screen.getByLabelText('Loan amount');
    expect(input).toBeInTheDocument();
  });

  it('renders the hint and connects it via aria-describedby', () => {
    render(
      <FormField label="Loan amount" hint="In US dollars">
        {({ id, describedBy }) => <input id={id} aria-describedby={describedBy} />}
      </FormField>,
    );
    const input = screen.getByLabelText('Loan amount');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const hint = screen.getByText('In US dollars');
    expect(hint).toBeInTheDocument();
    expect(describedBy?.split(' ')).toContain(hint.id);
  });

  it('renders an error with role=alert when supplied and connects it via aria-describedby', () => {
    render(
      <FormField label="Loan amount" error="Required field">
        {({ id, describedBy }) => <input id={id} aria-describedby={describedBy} />}
      </FormField>,
    );
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Required field');
    const input = screen.getByLabelText('Loan amount');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(error.id);
  });

  it('keeps tab order: input first, then any link in the error/hint region', async () => {
    render(
      <FormField label="Loan amount" error={<a href="/help">help</a>}>
        {({ id }) => <input id={id} type="text" />}
      </FormField>,
    );
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByLabelText('Loan amount')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'help' })).toHaveFocus();
  });

  it('marks the field with data-invalid when an error is present', () => {
    const { container } = render(
      <FormField label="x" error="bad">
        {({ id }) => <input id={id} />}
      </FormField>,
    );
    expect(container.querySelector('[data-invalid="true"]')).not.toBeNull();
  });
});
