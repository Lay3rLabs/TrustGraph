import Link from 'next/link'

import { NETWORKS } from '@/lib/network'

export default function NetworkListPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="ascii-art-title text-2xl font-bold">NETWORKS</div>

      {/* Network Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {NETWORKS.map((network) => (
          <Link
            key={network.id}
            href={`/network/${network.id}`}
            className="block"
          >
            <div className="border border-gray-300 bg-white p-6 rounded-sm shadow-sm hover:shadow-md transition-all hover:border-gray-400 cursor-pointer">
              <div className="space-y-4">
                {/* Network Name */}
                <div className="ascii-art-title text-xl text-gray-900">
                  {network.name}
                </div>

                {/* About */}
                <div className="text-sm text-gray-800">{network.about}</div>

                {/* View Link */}
                <div className="text-sm text-gray-900 pt-2">VIEW NETWORK →</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
