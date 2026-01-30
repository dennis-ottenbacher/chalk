import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

test('Example Test renders correctly', () => {
    const TestComponent = () => <div>Hello Chalk Test</div>
    render(<TestComponent />)
    expect(screen.getByText('Hello Chalk Test')).toBeInTheDocument()
})
