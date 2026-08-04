import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import CitationBadge from './CitationBadge';

test('renders and invokes an inline citation badge', () => {
  const onClick = vi.fn(); render(<CitationBadge id="C3" onClick={onClick} />);
  fireEvent.click(screen.getByRole('button', { name: '[3]' }));
  expect(onClick).toHaveBeenCalledWith('C3');
});
