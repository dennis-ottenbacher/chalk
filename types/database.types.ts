export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
    graphql_public: {
        Tables: {
            [_ in never]: never
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            graphql: {
                Args: {
                    extensions?: Json
                    operationName?: string
                    query?: string
                    variables?: Json
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
    public: {
        Tables: {
            chalk_chat_messages: {
                Row: {
                    content: string
                    created_at: string | null
                    id: string
                    organization_id: string
                    sender_role: string
                    user_id: string
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    id?: string
                    organization_id: string
                    sender_role: string
                    user_id: string
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    id?: string
                    organization_id?: string
                    sender_role?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'chalk_chat_messages_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'jorg_chat_messages_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            checkins: {
                Row: {
                    id: string
                    location_id: string | null
                    organization_id: string
                    processed_by: string | null
                    status: Database['public']['Enums']['checkin_status']
                    timestamp: string | null
                    user_id: string | null
                }
                Insert: {
                    id?: string
                    location_id?: string | null
                    organization_id?: string
                    processed_by?: string | null
                    status: Database['public']['Enums']['checkin_status']
                    timestamp?: string | null
                    user_id?: string | null
                }
                Update: {
                    id?: string
                    location_id?: string | null
                    organization_id?: string
                    processed_by?: string | null
                    status?: Database['public']['Enums']['checkin_status']
                    timestamp?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'checkins_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'checkins_processed_by_fkey'
                        columns: ['processed_by']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'checkins_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            conversation_states: {
                Row: {
                    data: Json | null
                    staff_id: string
                    state: string
                    updated_at: string | null
                }
                Insert: {
                    data?: Json | null
                    staff_id: string
                    state?: string
                    updated_at?: string | null
                }
                Update: {
                    data?: Json | null
                    staff_id?: string
                    state?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'conversation_states_staff_id_fkey'
                        columns: ['staff_id']
                        isOneToOne: true
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            document_chunks: {
                Row: {
                    chunk_index: number | null
                    content: string
                    created_at: string | null
                    document_id: string | null
                    embedding: string | null
                    id: string
                    organization_id: string
                }
                Insert: {
                    chunk_index?: number | null
                    content: string
                    created_at?: string | null
                    document_id?: string | null
                    embedding?: string | null
                    id?: string
                    organization_id?: string
                }
                Update: {
                    chunk_index?: number | null
                    content?: string
                    created_at?: string | null
                    document_id?: string | null
                    embedding?: string | null
                    id?: string
                    organization_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'document_chunks_document_id_fkey'
                        columns: ['document_id']
                        isOneToOne: false
                        referencedRelation: 'documents'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'document_chunks_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                ]
            }
            documents: {
                Row: {
                    content: string | null
                    created_at: string | null
                    id: string
                    metadata: Json | null
                    organization_id: string
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    content?: string | null
                    created_at?: string | null
                    id?: string
                    metadata?: Json | null
                    organization_id?: string
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    content?: string | null
                    created_at?: string | null
                    id?: string
                    metadata?: Json | null
                    organization_id?: string
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'documents_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                ]
            }
            organizations: {
                Row: {
                    created_at: string | null
                    custom_domain: string | null
                    id: string
                    name: string
                    settings: Json | null
                    slug: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    custom_domain?: string | null
                    id?: string
                    name: string
                    settings?: Json | null
                    slug: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    custom_domain?: string | null
                    id?: string
                    name?: string
                    settings?: Json | null
                    slug?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            products: {
                Row: {
                    active: boolean | null
                    created_at: string | null
                    credits_amount: number | null
                    description: string | null
                    duration_months: number | null
                    id: string
                    name: string
                    organization_id: string
                    price: number
                    recurring_interval: string | null
                    tax_rate: number | null
                    type: Database['public']['Enums']['product_type']
                }
                Insert: {
                    active?: boolean | null
                    created_at?: string | null
                    credits_amount?: number | null
                    description?: string | null
                    duration_months?: number | null
                    id?: string
                    name: string
                    organization_id?: string
                    price: number
                    recurring_interval?: string | null
                    tax_rate?: number | null
                    type: Database['public']['Enums']['product_type']
                }
                Update: {
                    active?: boolean | null
                    created_at?: string | null
                    credits_amount?: number | null
                    description?: string | null
                    duration_months?: number | null
                    id?: string
                    name?: string
                    organization_id?: string
                    price?: number
                    recurring_interval?: string | null
                    tax_rate?: number | null
                    type?: Database['public']['Enums']['product_type']
                }
                Relationships: [
                    {
                        foreignKeyName: 'products_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                ]
            }
            profiles: {
                Row: {
                    address: string | null
                    avatar_url: string | null
                    birth_date: string | null
                    city: string | null
                    created_at: string | null
                    first_name: string | null
                    id: string
                    last_name: string | null
                    member_id: string | null
                    organization_id: string
                    role: Database['public']['Enums']['user_role'] | null
                    updated_at: string | null
                    waiver_signed: boolean | null
                    zip_code: string | null
                }
                Insert: {
                    address?: string | null
                    avatar_url?: string | null
                    birth_date?: string | null
                    city?: string | null
                    created_at?: string | null
                    first_name?: string | null
                    id: string
                    last_name?: string | null
                    member_id?: string | null
                    organization_id?: string
                    role?: Database['public']['Enums']['user_role'] | null
                    updated_at?: string | null
                    waiver_signed?: boolean | null
                    zip_code?: string | null
                }
                Update: {
                    address?: string | null
                    avatar_url?: string | null
                    birth_date?: string | null
                    city?: string | null
                    created_at?: string | null
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    member_id?: string | null
                    organization_id?: string
                    role?: Database['public']['Enums']['user_role'] | null
                    updated_at?: string | null
                    waiver_signed?: boolean | null
                    zip_code?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'profiles_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                ]
            }
            role_permissions: {
                Row: {
                    access_level: string
                    created_at: string | null
                    id: string
                    organization_id: string
                    permission_key: string
                    role: Database['public']['Enums']['user_role']
                    updated_at: string | null
                }
                Insert: {
                    access_level: string
                    created_at?: string | null
                    id?: string
                    organization_id?: string
                    permission_key: string
                    role: Database['public']['Enums']['user_role']
                    updated_at?: string | null
                }
                Update: {
                    access_level?: string
                    created_at?: string | null
                    id?: string
                    organization_id?: string
                    permission_key?: string
                    role?: Database['public']['Enums']['user_role']
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'role_permissions_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                ]
            }
            saved_carts: {
                Row: {
                    created_at: string
                    id: string
                    items: Json
                    name: string
                    organization_id: string
                    staff_id: string | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    items: Json
                    name: string
                    organization_id: string
                    staff_id?: string | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    items?: Json
                    name?: string
                    organization_id?: string
                    staff_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'saved_carts_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'saved_carts_staff_id_fkey'
                        columns: ['staff_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            saved_weekly_templates: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                }
                Relationships: []
            }
            settings: {
                Row: {
                    company_address: string | null
                    company_city: string | null
                    company_country: string | null
                    company_name: string | null
                    company_tax_id: string | null
                    company_vat_id: string | null
                    company_zip: string | null
                    created_at: string
                    id: number
                    organization_id: string
                    pos_direct_checkout: boolean
                    updated_at: string
                    voucher_validity_mode: string
                    voucher_validity_years: number
                }
                Insert: {
                    company_address?: string | null
                    company_city?: string | null
                    company_country?: string | null
                    company_name?: string | null
                    company_tax_id?: string | null
                    company_vat_id?: string | null
                    company_zip?: string | null
                    created_at?: string
                    id?: number
                    organization_id: string
                    pos_direct_checkout?: boolean
                    updated_at?: string
                    voucher_validity_mode?: string
                    voucher_validity_years?: number
                }
                Update: {
                    company_address?: string | null
                    company_city?: string | null
                    company_country?: string | null
                    company_name?: string | null
                    company_tax_id?: string | null
                    company_vat_id?: string | null
                    company_zip?: string | null
                    created_at?: string
                    id?: number
                    organization_id?: string
                    pos_direct_checkout?: boolean
                    updated_at?: string
                    voucher_validity_mode?: string
                    voucher_validity_years?: number
                }
                Relationships: [
                    {
                        foreignKeyName: 'settings_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                ]
            }
            shift_templates: {
                Row: {
                    created_at: string | null
                    day_of_week: number
                    end_time: string
                    id: string
                    organization_id: string
                    role: string
                    start_time: string
                    template_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    day_of_week: number
                    end_time: string
                    id?: string
                    organization_id?: string
                    role: string
                    start_time: string
                    template_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    day_of_week?: number
                    end_time?: string
                    id?: string
                    organization_id?: string
                    role?: string
                    start_time?: string
                    template_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'shift_templates_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'shift_templates_template_id_fkey'
                        columns: ['template_id']
                        isOneToOne: false
                        referencedRelation: 'saved_weekly_templates'
                        referencedColumns: ['id']
                    },
                ]
            }
            shifts: {
                Row: {
                    created_at: string | null
                    end_time: string
                    id: string
                    notes: string | null
                    organization_id: string
                    role: string
                    staff_id: string | null
                    start_time: string
                    status: Database['public']['Enums']['shift_status']
                }
                Insert: {
                    created_at?: string | null
                    end_time: string
                    id?: string
                    notes?: string | null
                    organization_id?: string
                    role: string
                    staff_id?: string | null
                    start_time: string
                    status?: Database['public']['Enums']['shift_status']
                }
                Update: {
                    created_at?: string | null
                    end_time?: string
                    id?: string
                    notes?: string | null
                    organization_id?: string
                    role?: string
                    staff_id?: string | null
                    start_time?: string
                    status?: Database['public']['Enums']['shift_status']
                }
                Relationships: [
                    {
                        foreignKeyName: 'shifts_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'shifts_staff_id_fkey'
                        columns: ['staff_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            staff_chat_messages: {
                Row: {
                    content: string
                    created_at: string | null
                    id: string
                    sender_role: string
                    staff_id: string
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    id?: string
                    sender_role: string
                    staff_id: string
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    id?: string
                    sender_role?: string
                    staff_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'staff_chat_messages_staff_id_fkey'
                        columns: ['staff_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            staff_events: {
                Row: {
                    created_at: string | null
                    end_time: string
                    event_description: string
                    id: string
                    organization_id: string
                    staff_id: string
                    start_time: string
                }
                Insert: {
                    created_at?: string | null
                    end_time: string
                    event_description: string
                    id?: string
                    organization_id: string
                    staff_id: string
                    start_time: string
                }
                Update: {
                    created_at?: string | null
                    end_time?: string
                    event_description?: string
                    id?: string
                    organization_id?: string
                    staff_id?: string
                    start_time?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'staff_events_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'staff_events_staff_id_fkey'
                        columns: ['staff_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            staff_roles: {
                Row: {
                    created_at: string | null
                    id: string
                    role: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    role: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    role?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'staff_roles_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            subscriptions: {
                Row: {
                    created_at: string | null
                    end_date: string | null
                    id: string
                    is_active: boolean | null
                    organization_id: string
                    product_id: string | null
                    remaining_entries: number | null
                    start_date: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    end_date?: string | null
                    id?: string
                    is_active?: boolean | null
                    organization_id?: string
                    product_id?: string | null
                    remaining_entries?: number | null
                    start_date?: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    end_date?: string | null
                    id?: string
                    is_active?: boolean | null
                    organization_id?: string
                    product_id?: string | null
                    remaining_entries?: number | null
                    start_date?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'subscriptions_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'subscriptions_product_id_fkey'
                        columns: ['product_id']
                        isOneToOne: false
                        referencedRelation: 'products'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'subscriptions_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            transactions: {
                Row: {
                    created_at: string
                    id: string
                    items: Json
                    member_id: string | null
                    organization_id: string
                    payment_method: Database['public']['Enums']['payment_method']
                    staff_id: string | null
                    status: Database['public']['Enums']['transaction_status']
                    total_amount: number
                    tse_data: Json | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    items: Json
                    member_id?: string | null
                    organization_id: string
                    payment_method: Database['public']['Enums']['payment_method']
                    staff_id?: string | null
                    status?: Database['public']['Enums']['transaction_status']
                    total_amount: number
                    tse_data?: Json | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    items?: Json
                    member_id?: string | null
                    organization_id?: string
                    payment_method?: Database['public']['Enums']['payment_method']
                    staff_id?: string | null
                    status?: Database['public']['Enums']['transaction_status']
                    total_amount?: number
                    tse_data?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'transactions_member_id_fkey'
                        columns: ['member_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'transactions_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'transactions_staff_id_fkey'
                        columns: ['staff_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            tse_configurations: {
                Row: {
                    api_key: string
                    api_secret: string
                    client_id: string
                    created_at: string | null
                    environment: string | null
                    id: string
                    is_active: boolean | null
                    organization_id: string
                    tss_id: string
                    updated_at: string | null
                }
                Insert: {
                    api_key: string
                    api_secret: string
                    client_id: string
                    created_at?: string | null
                    environment?: string | null
                    id?: string
                    is_active?: boolean | null
                    organization_id: string
                    tss_id: string
                    updated_at?: string | null
                }
                Update: {
                    api_key?: string
                    api_secret?: string
                    client_id?: string
                    created_at?: string | null
                    environment?: string | null
                    id?: string
                    is_active?: boolean | null
                    organization_id?: string
                    tss_id?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'tse_configurations_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: true
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                ]
            }
            vouchers: {
                Row: {
                    code: string
                    created_at: string | null
                    expires_at: string | null
                    id: string
                    initial_amount: number
                    organization_id: string
                    remaining_amount: number
                    status: string
                    transaction_id: string | null
                }
                Insert: {
                    code: string
                    created_at?: string | null
                    expires_at?: string | null
                    id?: string
                    initial_amount: number
                    organization_id: string
                    remaining_amount: number
                    status?: string
                    transaction_id?: string | null
                }
                Update: {
                    code?: string
                    created_at?: string | null
                    expires_at?: string | null
                    id?: string
                    initial_amount?: number
                    organization_id?: string
                    remaining_amount?: number
                    status?: string
                    transaction_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'vouchers_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: false
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'vouchers_transaction_id_fkey'
                        columns: ['transaction_id']
                        isOneToOne: false
                        referencedRelation: 'transactions'
                        referencedColumns: ['id']
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            match_documents: {
                Args: {
                    match_count: number
                    match_threshold: number
                    org_id: string
                    query_embedding: string
                }
                Returns: {
                    content: string
                    document_id: string
                    id: string
                    similarity: number
                }[]
            }
            user_organization_id: { Args: never; Returns: string }
        }
        Enums: {
            checkin_status: 'valid' | 'invalid' | 'pending'
            payment_method: 'cash' | 'card' | 'voucher'
            product_type: 'goods' | 'entry' | 'rental' | 'voucher' | 'plan'
            shift_status: 'draft' | 'published' | 'cancelled'
            transaction_status: 'completed' | 'cancelled' | 'refunded'
            user_role: 'admin' | 'staff' | 'member' | 'athlete' | 'manager'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
          ? R
          : never
      : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I
        }
          ? I
          : never
      : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U
        }
          ? U
          : never
      : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never

export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {
            checkin_status: ['valid', 'invalid', 'pending'],
            payment_method: ['cash', 'card', 'voucher'],
            product_type: ['goods', 'entry', 'rental', 'voucher', 'plan'],
            shift_status: ['draft', 'published', 'cancelled'],
            transaction_status: ['completed', 'cancelled', 'refunded'],
            user_role: ['admin', 'staff', 'member', 'athlete', 'manager'],
        },
    },
} as const
