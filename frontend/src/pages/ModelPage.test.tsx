import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ModelInfoResponse, ModelMetrics } from '../types'
import { ModelPage } from './ModelPage'

const mockUseModelInfo = vi.fn()
vi.mock('../hooks/useModelInfo', () => ({ useModelInfo: () => mockUseModelInfo() }))
vi.mock('../hooks/useGestures', () => ({
  useGestures: () => ({
    gestures: [
      { id: 'fist', name: 'Fist', emoji: '', description: '' },
      { id: 'open_palm', name: 'Open Palm', emoji: '', description: '' },
    ],
    loading: false,
    error: null,
  }),
}))

const metrics = (over: Partial<ModelMetrics> = {}): ModelMetrics => ({
  accuracy: 0.9,
  precision_macro: 0.9,
  recall_macro: 0.9,
  f1_macro: 0.9,
  per_class: {},
  confusion_matrix: [
    [5, 1],
    [0, 6],
  ],
  confusion_labels: ['fist', 'open_palm'],
  ...over,
})

const REPORT: ModelInfoResponse = {
  default_classifier: 'rule',
  ml_available: true,
  report: {
    generated_at: '2026-09-04T00:00:00Z',
    dataset: 'synthetic',
    provisional: true,
    sklearn_version: '1.6.1',
    n_samples: 100,
    n_train: 75,
    n_test: 25,
    split: 'group-by-session',
    labels: ['fist', 'open_palm'],
    selected_model: 'logreg',
    models: {
      rule_based: metrics({ f1_macro: 0.8 }),
      logreg: metrics({ f1_macro: 0.95 }),
    },
    notes: ['synthetic data - provisional'],
  },
}

const render_ = () =>
  render(
    <MemoryRouter>
      <ModelPage />
    </MemoryRouter>,
  )

afterEach(() => vi.clearAllMocks())

describe('ModelPage', () => {
  it('shows a loading state', () => {
    mockUseModelInfo.mockReturnValue({ info: null, loading: true, error: null })
    render_()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows training instructions when there is no report', () => {
    mockUseModelInfo.mockReturnValue({
      info: { default_classifier: 'rule', ml_available: false, report: null },
      loading: false,
      error: null,
    })
    render_()
    expect(screen.getByText(/no comparison report yet/i)).toBeInTheDocument()
    expect(screen.getByText(/python -m ml\.train/)).toBeInTheDocument()
  })

  it('renders the comparison table, provisional banner and confusion matrices', () => {
    mockUseModelInfo.mockReturnValue({ info: REPORT, loading: false, error: null })
    render_()

    expect(screen.getByText(/provisional results/i)).toBeInTheDocument()
    expect(screen.getByText(/rule_based \(baseline\)/i)).toBeInTheDocument()
    expect(screen.getByText(/logreg ★/)).toBeInTheDocument()
    expect(screen.getByText(/rule-based — confusion matrix/i)).toBeInTheDocument()
    expect(screen.getByText(/logreg — confusion matrix/i)).toBeInTheDocument()
  })
})
