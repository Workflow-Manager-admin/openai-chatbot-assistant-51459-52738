import { render, screen } from '@testing-library/react';
import App from './App';

test('renders chatbot assistant header', () => {
  render(<App />);
  const header = screen.getByText(/chatbot assistant/i);
  expect(header).toBeInTheDocument();
});
