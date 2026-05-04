// Side-effect import: theme tokens land on :root whenever any consumer
// imports from @calc/ui. This is the load-bearing path for federated
// hosts — when they import `'calculators/CalculatorsApp'` (or any
// per-calc expose), the calc Components import @calc/ui, which pulls
// theme.css into the chunk graph. Without this, federated hosts get
// CSS Modules that reference var(--calc-color-X) on a :root that has
// no token definitions, and surfaces render transparent.
import './theme.css';

export { AriaLive } from './AriaLive';
export type { AriaLiveProps } from './AriaLive';
export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';
export { NumberInput } from './NumberInput';
export type { NumberInputProps } from './NumberInput';
export { CurrencyInput } from './CurrencyInput';
export type { CurrencyInputProps } from './CurrencyInput';
export { PercentInput } from './PercentInput';
export type { PercentInputProps } from './PercentInput';
export { ResultDisplay } from './ResultDisplay';
export type { ResultDisplayProps } from './ResultDisplay';
