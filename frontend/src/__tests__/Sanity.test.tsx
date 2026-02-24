import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Sanity Check', () => {
    test('renders a simple div', () => {
        render(<div data-testid="sanity">Hello World</div>);
        expect(screen.getByTestId('sanity')).toHaveTextContent('Hello World');
    });
});
