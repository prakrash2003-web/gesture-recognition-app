import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import type { WebcamStatus } from '../hooks/useWebcam'
import { CameraView } from './CameraView'

function renderView(status: WebcamStatus, errorDetail: string | null = null) {
  return render(
    <CameraView
      videoRef={createRef()}
      overlayRef={createRef()}
      stream={null}
      status={status}
      errorDetail={errorDetail}
    />,
  )
}

describe('CameraView', () => {
  it('prompts the user to start when idle', () => {
    renderView('idle')
    expect(screen.getByText('Camera off')).toBeInTheDocument()
  })

  it('explains a denied permission', () => {
    renderView('denied')
    expect(screen.getByText('Camera permission denied')).toBeInTheDocument()
  })

  it('explains an insecure / unsupported context', () => {
    renderView('unavailable')
    expect(screen.getByText('Camera not supported here')).toBeInTheDocument()
  })

  it('shows the raw error detail for an "in use" camera', () => {
    renderView('inUse', 'Could not start video source')
    expect(screen.getByText('Could not start video source')).toBeInTheDocument()
  })

  it('shows no overlay message once active', () => {
    renderView('active')
    expect(screen.queryByText(/camera/i)).not.toBeInTheDocument()
  })
})
