/**
 * Fiskaly TSE Service
 *
 * Handles all interactions with the fiskaly Cloud TSE API for German fiscal compliance.
 * Provides transaction signing, DSFinV-K export, and TSE management functionality.
 *
 * @see https://developer.fiskaly.com/api/kassensichv/v2
 */

import axios, { AxiosInstance } from 'axios'

export interface FiskalyConfig {
    apiKey: string
    apiSecret: string
    tssId: string
    clientId: string
    environment?: 'sandbox' | 'production'
}

export interface FiskalyTransaction {
    state: 'ACTIVE' | 'FINISHED' | 'CANCELLED'
    client_id: string
}

export interface FiskalyTransactionResponse {
    _id: string
    _type: string
    state: string
    client_id: string
    time_start: number
    time_end?: number
    number: number
    signature: {
        value: string
        algorithm: string
        counter: number
    }
    qr_code_data?: string
    schema?: {
        standard_v1: {
            receipt: {
                receipt_type: string
                amounts_per_vat_rate: Array<{
                    vat_rate: string
                    amount: string
                }>
                amounts_per_payment_type: Array<{
                    payment_type: string
                    amount: string
                }>
            }
        }
    }
}

export interface TseSignatureData {
    transaction_number: number
    signature_value: string
    signature_counter: number
    time_start: number
    time_end: number
    qr_code_data?: string
    tss_id: string
    client_id: string
}

export class FiskalyService {
    private client: AxiosInstance
    private config: FiskalyConfig
    private baseUrl: string
    private authToken?: string
    private tokenExpiry?: number

    constructor(config: FiskalyConfig) {
        this.config = config
        this.baseUrl =
            config.environment === 'sandbox'
                ? 'https://kassensichv-middleware.fiskaly.com/api/v2'
                : 'https://kassensichv-middleware.fiskaly.com/api/v2'

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        // Add auth interceptor
        this.client.interceptors.request.use(async config => {
            const token = await this.getAuthToken()
            config.headers.Authorization = `Bearer ${token}`
            return config
        })
    }

    /**
     * Authenticate with fiskaly API and get access token
     */
    private async getAuthToken(): Promise<string> {
        // Return cached token if still valid
        if (this.authToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.authToken
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/auth`,
                {
                    api_key: this.config.apiKey,
                    api_secret: this.config.apiSecret,
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            )

            this.authToken = response.data.access_token
            // Token typically expires in 1 hour, refresh 5 minutes before
            this.tokenExpiry = Date.now() + 55 * 60 * 1000

            if (!this.authToken) {
                throw new Error('No access token received from fiskaly')
            }

            return this.authToken
        } catch (error) {
            console.error('Fiskaly authentication failed:', error)
            throw new Error('Failed to authenticate with TSE service')
        }
    }

    /**
     * Initialize the TSS (must be called once before first use in sandbox)
     */
    async initializeTss(): Promise<void> {
        try {
            // Check current TSS state
            const response = await this.client.get(`/tss/${this.config.tssId}`)
            const state = response.data.state

            console.log('[Fiskaly] TSS state:', state)

            // If TSS is CREATED, we need to initialize it
            if (state === 'CREATED') {
                console.log('[Fiskaly] Initializing TSS...')
                await this.client.patch(`/tss/${this.config.tssId}`, { state: 'INITIALIZED' })
                console.log('[Fiskaly] TSS initialized successfully')
            }
        } catch (error) {
            console.error('[Fiskaly] Failed to initialize TSS:', error)
            throw new Error('Failed to initialize TSS')
        }
    }

    /**
     * Ensure client is registered with the TSS
     */
    async ensureClientRegistered(): Promise<void> {
        try {
            await this.client.put(`/tss/${this.config.tssId}/client/${this.config.clientId}`, {
                serial_number: this.config.clientId,
            })
            console.log('[Fiskaly] Client registered/verified')
        } catch (error) {
            console.error('[Fiskaly] Failed to register client:', error)
            throw new Error('Failed to register client')
        }
    }

    /**
     * Start a new transaction
     */
    async startTransaction(transactionId: string): Promise<FiskalyTransactionResponse> {
        try {
            const response = await this.client.put(
                `/tss/${this.config.tssId}/tx/${transactionId}`,
                {
                    state: 'ACTIVE',
                    client_id: this.config.clientId,
                } as FiskalyTransaction
            )

            return response.data
        } catch (error) {
            console.error('Failed to start TSE transaction:', error)
            throw new Error('Failed to start TSE transaction')
        }
    }

    /**
     * Finish a transaction and get signature
     */
    async finishTransaction(
        transactionId: string,
        totalAmount: number,
        paymentMethod: 'cash' | 'card',
        items: Array<{ name: string; price: number; quantity: number; vat_rate?: number }>
    ): Promise<TseSignatureData> {
        try {
            // Calculate amounts per VAT rate (default 19% for Germany)
            const amountsPerVatRate = this.calculateVatAmounts(items)

            const response = await this.client.put<FiskalyTransactionResponse>(
                `/tss/${this.config.tssId}/tx/${transactionId}`,
                {
                    state: 'FINISHED',
                    client_id: this.config.clientId,
                    schema: {
                        standard_v1: {
                            receipt: {
                                receipt_type: 'RECEIPT',
                                amounts_per_vat_rate: amountsPerVatRate,
                                amounts_per_payment_type: [
                                    {
                                        payment_type: paymentMethod === 'cash' ? 'CASH' : 'CARD',
                                        amount: totalAmount.toFixed(2),
                                    },
                                ],
                            },
                        },
                    },
                }
            )

            const data = response.data

            return {
                transaction_number: data.number,
                signature_value: data.signature.value,
                signature_counter: data.signature.counter,
                time_start: data.time_start,
                time_end: data.time_end || Date.now(),
                qr_code_data: data.qr_code_data,
                tss_id: this.config.tssId,
                client_id: this.config.clientId,
            }
        } catch (error) {
            console.error('Failed to finish TSE transaction:', error)
            throw new Error('Failed to finish TSE transaction')
        }
    }

    /**
     * Cancel a transaction
     */
    async cancelTransaction(transactionId: string): Promise<void> {
        try {
            await this.client.put(`/tss/${this.config.tssId}/tx/${transactionId}`, {
                state: 'CANCELLED',
                client_id: this.config.clientId,
            })
        } catch (error) {
            console.error('Failed to cancel TSE transaction:', error)
            throw new Error('Failed to cancel TSE transaction')
        }
    }

    /**
     * Export DSFinV-K data for tax audit
     */
    async exportDSFinVK(startDate: Date, endDate: Date): Promise<Blob> {
        try {
            const response = await this.client.post(
                `/tss/${this.config.tssId}/export`,
                {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                },
                {
                    responseType: 'blob',
                }
            )

            return response.data
        } catch (error) {
            console.error('Failed to export DSFinV-K:', error)
            throw new Error('Failed to export DSFinV-K data')
        }
    }

    /**
     * Calculate VAT amounts from items
     */
    private calculateVatAmounts(
        items: Array<{ price: number; quantity: number; vat_rate?: number }>
    ): Array<{ vat_rate: string; amount: string }> {
        const vatMap = new Map<number, number>()

        items.forEach(item => {
            const vatRate = item.vat_rate || 19 // Default 19% VAT for Germany
            const amount = item.price * item.quantity
            const currentAmount = vatMap.get(vatRate) || 0
            vatMap.set(vatRate, currentAmount + amount)
        })

        return Array.from(vatMap.entries()).map(([rate, amount]) => ({
            vat_rate: (rate / 100).toFixed(4), // Convert to decimal (19 -> 0.1900)
            amount: amount.toFixed(2),
        }))
    }

    /**
     * Health check for TSE connection
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.getAuthToken()
            const response = await this.client.get(`/tss/${this.config.tssId}`)

            // Also try to register/verify the client
            try {
                await this.registerClient()
            } catch (clientError) {
                console.warn('Failed to register client during health check:', clientError)
                // We don't fail health check just for this, but it might cause tx failure later
            }

            return response.status === 200
        } catch (error) {
            console.error('TSE health check failed:', error)
            return false
        }
    }

    /**
     * Register or update the client (POS system) with the TSS
     */
    async registerClient(): Promise<void> {
        try {
            await this.getAuthToken()
            await this.client.put(`/tss/${this.config.tssId}/client/${this.config.clientId}`, {
                serial_number: this.config.clientId, // Use ID as serial number for simplicity
            })
        } catch (error) {
            console.error('Failed to register client:', error)
            throw new Error('Failed to register client with TSS')
        }
    }
}
