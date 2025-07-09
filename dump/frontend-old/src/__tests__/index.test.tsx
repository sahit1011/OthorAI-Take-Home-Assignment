import { render, screen } from '@testing-library/react'
import Home from '@/pages/index'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', {
      name: /othor ai/i,
    })
    
    expect(heading).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<Home />)
    
    const description = screen.getByText(/mini ai analyst as a service/i)
    
    expect(description).toBeInTheDocument()
  })

  it('renders the start analysis button', () => {
    render(<Home />)
    
    const button = screen.getByRole('button', {
      name: /start analysis/i,
    })
    
    expect(button).toBeInTheDocument()
  })

  it('renders the feature sections', () => {
    render(<Home />)
    
    const dataProfilingFeature = screen.getByText(/data profiling/i)
    const autoMLFeature = screen.getByText(/automl pipeline/i)
    
    expect(dataProfilingFeature).toBeInTheDocument()
    expect(autoMLFeature).toBeInTheDocument()
  })
})
