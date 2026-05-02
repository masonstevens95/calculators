import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NumberInput } from '../src/NumberInput';

function Controlled({
  initial = '' as number | '',
  onValue,
}: {
  initial?: number | '';
  onValue?: (v: number | '') => void;
}) {
  const [value, setValue] = useState<number | ''>(initial);
  return (
    <NumberInput
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
      aria-label="amt"
    />
  );
}

describe('<NumberInput />', () => {
  it('renders as type="number" and propagates entered value as a number', async () => {
    const seen = vi.fn();
    render(<Controlled onValue={seen} />);
    const input = screen.getByLabelText('amt');
    expect(input).toHaveAttribute('type', 'number');

    const user = userEvent.setup();
    await user.type(input, '42');
    // Cumulative typing on a controlled input: last value is the parsed number
    expect(seen).toHaveBeenLastCalledWith(42);
  });

  it('emits empty string when cleared', async () => {
    const seen = vi.fn();
    render(<Controlled initial={5} onValue={seen} />);
    const input = screen.getByLabelText('amt');
    const user = userEvent.setup();
    await user.clear(input);
    expect(seen).toHaveBeenLastCalledWith('');
  });

  it('toggles step="any" / inputMode based on allowDecimal', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <NumberInput value={0} onChange={onChange} allowDecimal aria-label="a" />,
    );
    expect(screen.getByLabelText('a')).toHaveAttribute('inputmode', 'decimal');
    rerender(<NumberInput value={0} onChange={onChange} allowDecimal={false} aria-label="a" />);
    expect(screen.getByLabelText('a')).toHaveAttribute('inputmode', 'numeric');
  });
});
