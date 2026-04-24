import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard prompt', () => {
  render(<App />);
  const element = screen.getByText(/please authenticate first/i);
  expect(element).toBeInTheDocument();
});