// TypeScript mirrors of the backend's Pydantic models (backend/app/schemas.py).
// Keeping these in sync by hand is fine for a project this size; the shapes rarely
// change and the compiler catches a mismatch the moment we use a wrong field name.

/** One recognizable gesture (from GET /gestures and the WS "ready" message). */
export interface Gesture {
  id: string
  name: string
  emoji: string
  description: string
}

export interface HealthResponse {
  status: string
  service: string
  version: string
}

export interface GesturesResponse {
  count: number
  gestures: Gesture[]
}

export type ClassifierKind = 'rule' | 'ml'

// --- Model comparison (GET /model) -------------------------------------------

export interface ClassMetrics {
  precision: number
  recall: number
  f1: number
  support: number
}

export interface ModelMetrics {
  accuracy: number
  precision_macro: number
  recall_macro: number
  f1_macro: number
  per_class: Record<string, ClassMetrics>
  confusion_matrix: number[][]
  confusion_labels: string[]
  cv_f1_macro_mean?: number
  cv_f1_macro_std?: number
}

export interface ModelReport {
  generated_at: string
  dataset: 'synthetic' | 'real' | string
  provisional: boolean
  sklearn_version: string
  n_samples: number
  n_train: number
  n_test: number
  split: string
  labels: string[]
  selected_model: string
  models: Record<string, ModelMetrics>
  notes: string[]
}

export interface ModelInfoResponse {
  default_classifier: ClassifierKind
  ml_available: boolean
  report: ModelReport | null
}

// --- WebSocket messages (server -> client) ------------------------------------

export interface ReadyMessage {
  type: 'ready'
  gestures: Gesture[]
  recommended_fps: number
  min_confidence: number
  classifier: ClassifierKind
  ml_available: boolean
}

export interface FrameResultMessage {
  type: 'result'
  gesture: string | null
  confidence: number
  hand_present: boolean
  handedness: string | null
  /** 21 [x, y] points in 0..1 frame coordinates, or null when no hand. */
  landmarks: [number, number][] | null
  scores: Record<string, number>
  inference_ms: number
  frames_dropped: number
}

export interface ErrorMessage {
  type: 'error'
  detail: string
}

/** Any message the server can push over the socket. Switch on `.type`. */
export type ServerMessage = ReadyMessage | FrameResultMessage | ErrorMessage
