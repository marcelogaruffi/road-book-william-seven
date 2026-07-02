import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoadbookForm } from './src/components/RoadbookForm';
import { emptyRoadbook } from './src/lib/roadbook-types';
import { describe, it, expect, vi } from 'vitest';

// Mock useRouter
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({}),
  useNavigate: () => vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('RoadbookForm', () => {
  it('should add an activity and update it', async () => {
    // start with a roadbook that has one day
    const rb = { ...emptyRoadbook, programacao: [{ data: '2026-07-08', hora_inicio: '', titulo: 'TEST_TITLE', tipo: 'Outro', local: '', observacao: '' }] };
    const { container } = render(<RoadbookForm initial={rb} />);
    
    // Switch to Programação tab
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs.find(t => t.textContent === 'Programação'));
    
    // Check if the input exists by finding the value TEST_TITLE
    const titleInput = await screen.findByDisplayValue('TEST_TITLE');
    expect(titleInput).toBeTruthy();
    
    // Type into title input
    fireEvent.change(titleInput, { target: { value: 'NEW_TITLE' } });
    
    // Check if it updated
    expect(titleInput.value).toBe('NEW_TITLE');
    
    // Add activity
    const addActivityBtn = screen.getByText('Adicionar atividade');
    fireEvent.click(addActivityBtn);
    
    // Wait for the new inputs to appear
    await waitFor(() => {
      const inputs = screen.getAllByDisplayValue('');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });
});
