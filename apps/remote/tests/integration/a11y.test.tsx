// @vitest-environment jsdom
//
// Cross-cutting accessibility audit (U12). Renders each route under the real
// CalculatorsApp and runs axe-core against the resulting DOM. Fails on
// violations rated 'critical' or 'serious'; lower-severity findings are
// captured in docs/accessibility.md as accepted issues with rationale.

import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, afterEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CalculatorsRoutes } from '../../src/CalculatorsRoutes';
import { calculators } from '../../src/calculators';

expect.extend(toHaveNoViolations);

afterEach(() => cleanup());

const SEVERE = ['critical', 'serious'] as const;

async function auditRoute(path: string) {
  const { container } = render(
    <MemoryRouter initialEntries={[path]}>
      <CalculatorsRoutes />
    </MemoryRouter>,
  );
  const results = await axe(container, {
    // Color-contrast disabled in this layer: CSS Modules + jsdom don't
    // resolve computed styles reliably enough for axe to check contrast.
    // Manual visual review captures contrast violations (see
    // docs/accessibility.md).
    rules: {
      'color-contrast': { enabled: false },
    },
  });

  const severeViolations = results.violations.filter((v) =>
    SEVERE.includes(v.impact as (typeof SEVERE)[number]),
  );
  return { results, severeViolations };
}

describe('a11y: shell pages', () => {
  it('HomePage has no critical/serious axe violations', async () => {
    const { severeViolations } = await auditRoute('/');
    expect(severeViolations).toEqual([]);
  });

  it('NotFoundPage has no critical/serious axe violations', async () => {
    const { severeViolations } = await auditRoute('/totally-unknown-path');
    expect(severeViolations).toEqual([]);
  });
});

describe('a11y: each /calc/:slug page', () => {
  for (const calc of calculators) {
    it(`${calc.slug} renders with no critical/serious axe violations under AppLayout`, async () => {
      const { severeViolations } = await auditRoute(`/calc/${calc.slug}`);
      expect(severeViolations).toEqual([]);
    });
  }
});

describe('a11y: each /embed/:slug page', () => {
  for (const calc of calculators) {
    it(`${calc.slug} renders with no critical/serious axe violations under EmbedLayout`, async () => {
      const { severeViolations } = await auditRoute(`/embed/${calc.slug}`);
      expect(severeViolations).toEqual([]);
    });
  }
});
