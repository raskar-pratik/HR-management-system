import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import type { ReactElement } from 'react';

/**
 * Wraps a component in BrowserRouter for tests that need routing context.
 */
export function renderWithRouter(ui: ReactElement) {
    return render(ui, { wrapper: BrowserRouter });
}
