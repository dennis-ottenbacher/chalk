import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WaiverToggle } from '@/components/members/WaiverToggle'
import { expect, test, vi, describe } from 'vitest'
import * as memberActions from '@/app/actions/members'

// Mock the server action
vi.mock('@/app/actions/members', () => ({
    toggleWaiver: vi.fn(),
}))

describe('WaiverToggle', () => {
    test('renders correctly with initial status true', () => {
        render(<WaiverToggle userId="123" initialStatus={true} />)
        expect(screen.getByText('Signed')).toBeInTheDocument()
        // Check for the green background class which indicates signed
        const button = screen.getByRole('button')
        expect(button).toHaveClass('bg-green-600')
    })

    test('renders correctly with initial status false', () => {
        render(<WaiverToggle userId="123" initialStatus={false} />)
        expect(screen.getByText('Not Signed')).toBeInTheDocument()
        const button = screen.getByRole('button')
        expect(button).toHaveClass('bg-zinc-200')
    })

    test('toggles status when clicked', async () => {
        const toggleMock = vi.mocked(memberActions.toggleWaiver).mockResolvedValue(undefined)

        render(<WaiverToggle userId="123" initialStatus={false} />)
        const button = screen.getByRole('button')

        fireEvent.click(button)

        // Optimistic or waiting for update - component sets loading then updates
        await waitFor(() => {
            expect(toggleMock).toHaveBeenCalledWith('123', true)
        })

        expect(screen.getByText('Signed')).toBeInTheDocument()
    })

    test('handles error gracefully', async () => {
        const toggleMock = vi
            .mocked(memberActions.toggleWaiver)
            .mockRejectedValue(new Error('Failed'))
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
        const consoleMock = vi.spyOn(console, 'error').mockImplementation(() => {})

        render(<WaiverToggle userId="123" initialStatus={false} />)
        const button = screen.getByRole('button')

        fireEvent.click(button)

        await waitFor(() => {
            expect(toggleMock).toHaveBeenCalled()
            expect(alertMock).toHaveBeenCalledWith('Failed to update waiver status')
        })

        // Should revert or stay at initial status (logic in component just doesn't update if it failed?
        // Wait, looking at code: it sets status AFTER await. So if await fails, setStatus is not called.
        expect(screen.getByText('Not Signed')).toBeInTheDocument()

        alertMock.mockRestore()
        consoleMock.mockRestore()
    })
})
