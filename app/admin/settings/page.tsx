import { getSettings } from '@/app/actions/settings'
import { getTseConfig } from '@/app/actions/tse'
import SettingsForm from './settings-form'
import TseSettings from '@/components/admin/tse-settings'
import VoucherValiditySettings from './voucher-validity-settings'

import CompanySettingsForm from '@/components/admin/company-settings-form'

export default async function AdminSettingsPage() {
    const settings = await getSettings()
    const tseConfig = await getTseConfig()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <CompanySettingsForm initialSettings={settings} />

            <div className="pt-6">
                <h2 className="text-2xl font-bold tracking-tight mb-4">POS Settings</h2>
                <div className="space-y-4">
                    <SettingsForm initialSettings={settings} />
                    <VoucherValiditySettings initialSettings={settings} />
                </div>
            </div>

            <div className="pt-6">
                <h2 className="text-2xl font-bold tracking-tight mb-4">TSE (Fiscal Compliance)</h2>
                <TseSettings initialConfig={tseConfig} />
            </div>
        </div>
    )
}
