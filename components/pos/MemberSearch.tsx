'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, User, X } from 'lucide-react'
import { searchMembers, MemberSearchResult } from '@/app/actions/members'

export type MemberSearchProps = {
    onSelect: (member: MemberSearchResult) => void
    selectedMember?: { id: string; name: string } | null
    onClear: () => void
    placeholder?: string
    compact?: boolean
}

export function MemberSearch({
    onSelect,
    selectedMember,
    onClear,
    placeholder = 'Search member...',
    compact = false,
}: MemberSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<MemberSearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)

    const searchRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSearch = async (value: string) => {
        setQuery(value)
        if (value.length < 2) {
            setResults([])
            return
        }

        setLoading(true)
        setShowResults(true)
        try {
            const data = await searchMembers(value)
            setResults(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (member: MemberSearchResult) => {
        onSelect(member)
        setQuery('')
        setResults([])
        setShowResults(false)
    }

    if (selectedMember) {
        return (
            <div className={`${compact ? 'p-2' : 'p-4 border-b border-gray-200 bg-gray-50'}`}>
                <div
                    className={`flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md ${compact ? 'p-2' : 'p-3'}`}
                >
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-100 p-1.5 rounded-full">
                            <User className="h-3 w-3 text-emerald-600" />
                        </div>
                        <div>
                            {!compact && (
                                <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">
                                    Member
                                </p>
                            )}
                            <p className="text-sm font-bold text-emerald-900 line-clamp-1">
                                {selectedMember.name}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClear}
                        className="h-6 w-6 text-gray-400 hover:text-gray-900"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div
            className={`${compact ? 'p-2' : 'p-4 border-b border-gray-200'} relative z-50`}
            ref={searchRef}
        >
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                    placeholder={placeholder}
                    className="pl-8 bg-white border-gray-200 text-gray-900 placeholder:text-gray-500 focus-visible:ring-emerald-500/50 h-9 text-sm"
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                    onFocus={() => {
                        if (query.length >= 2) setShowResults(true)
                    }}
                />
            </div>

            {showResults && (results.length > 0 || loading) && (
                <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden max-h-60 overflow-y-auto z-[100]">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
                    ) : (
                        results.map(member => (
                            <button
                                key={member.id}
                                className="w-full text-left p-2.5 hover:bg-gray-100 flex flex-col gap-0.5 border-b border-gray-100 last:border-0"
                                onClick={() => handleSelect(member)}
                            >
                                <div className="flex justify-between items-baseline w-full">
                                    <span className="font-medium text-gray-900 text-sm">
                                        {member.first_name} {member.last_name}
                                    </span>
                                    {member.birth_date && (
                                        <span className="text-xs text-gray-500">
                                            {new Date(member.birth_date).toLocaleDateString(
                                                'de-DE',
                                                {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                }
                                            )}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-500 w-full block">
                                    {member.member_id}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
