'use client'

import { useParams, useRouter } from 'next/navigation'
import type React from 'react'
import { useAccount, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

import { AttestationCard } from '@/components/AttestationCard'
import { CreateAttestationModal } from '@/components/CreateAttestationModal'
import { Address } from '@/components/ui/address'
import { Button } from '@/components/ui/button'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { useAccountProfile } from '@/hooks/useAccountProfile'
import { TRUSTED_SEEDS } from '@/lib/config'

export default function AccountProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { isConnected, address: connectedAddress } = useAccount()
  const { connect } = useConnect()

  const address = params.address as string

  const {
    isLoading,
    error,
    profileData,
    attestationsGiven,
    attestationsReceived,
    isLoadingAttestationsGiven,
    isLoadingAttestationsReceived,
    refresh,
  } = useAccountProfile(address)

  const handleConnect = () => {
    try {
      connect({ connector: injected() })
    } catch (err) {
      console.error('Failed to connect wallet:', err)
    }
  }

  const formatAmount = (amount: string) => {
    return BigInt(amount || 0).toLocaleString()
  }

  const isTrustedSeed = TRUSTED_SEEDS.includes(address)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Address
                address={address}
                className="ascii-art-title [&>span]:!text-xl [&>span]:!font-bold"
                displayMode="full"
                showCopyIcon={true}
                clickable={false}
              />
              {isTrustedSeed && (
                <div className="flex items-center gap-1">
                  <span title="Trusted Seed">⚡</span>
                  <InfoTooltip content="This account is a trusted seed member with enhanced network privileges." />
                </div>
              )}
            </div>
            <div
              className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
              onClick={() => router.push('/network')}
            >
              ← Back to Network
            </div>
          </div>
          {connectedAddress &&
            connectedAddress.toLowerCase() === address.toLowerCase() && (
              <CreateAttestationModal />
            )}
        </div>
      </div>

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="border border-gray-300 bg-white p-6 rounded-sm text-center space-y-4 shadow-sm">
          <div className="terminal-text text-lg text-gray-900">
            WALLET CONNECTION REQUIRED
          </div>
          <div className="terminal-dim text-sm text-gray-600">
            Connect your wallet to view profile details
          </div>
          <Button
            onClick={handleConnect}
            className="mobile-terminal-btn !px-6 !py-2"
          >
            <span className="terminal-command text-xs">CONNECT WALLET</span>
          </Button>
        </div>
      )}

      {isConnected && (
        <>
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="terminal-bright text-sm text-gray-900">
                ◉ LOADING PROFILE DATA ◉
              </div>
              <div className="terminal-dim text-xs mt-2 text-gray-600">
                Fetching account information...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="border border-red-500 bg-red-50 p-4 rounded-sm">
              <div className="error-text text-sm text-red-700">⚠️ {error}</div>
              <Button
                onClick={refresh}
                className="mt-3 mobile-terminal-btn !px-4 !py-2"
              >
                <span className="text-xs">RETRY</span>
              </Button>
            </div>
          )}

          {/* Account Info */}
          {!isLoading && profileData && (
            <>
              {/* Profile Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
                  <div className="space-y-2">
                    <div className="terminal-dim text-xs text-gray-600 flex items-center gap-1">
                      TRUST SCORE
                      <InfoTooltip content="The account's reputation score in the trust network." />
                    </div>
                    <div className="terminal-bright text-2xl text-gray-900">
                      {formatAmount(profileData.trustScore)}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
                  <div className="space-y-2">
                    <div className="terminal-dim text-xs text-gray-600 flex items-center gap-1">
                      NETWORK RANK
                      <InfoTooltip content="The account's ranking in the trust network by reputation." />
                    </div>
                    <div className="terminal-bright text-2xl text-gray-900">
                      {profileData.networkParticipant
                        ? `#${profileData.rank}`
                        : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
                  <div className="space-y-2">
                    <div className="terminal-dim text-xs text-gray-600 flex items-center gap-1">
                      ATTESTATIONS RECEIVED
                      <InfoTooltip content="Number of attestations this account has received from others." />
                    </div>
                    <div className="terminal-bright text-2xl text-gray-900">
                      {profileData.attestationsReceived}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-300 bg-white p-4 rounded-sm shadow-sm">
                  <div className="space-y-2">
                    <div className="terminal-dim text-xs text-gray-600 flex items-center gap-1">
                      ATTESTATIONS GIVEN
                      <InfoTooltip content="Number of attestations this account has made to others." />
                    </div>
                    <div className="terminal-bright text-2xl text-gray-900">
                      {profileData.attestationsGiven}
                    </div>
                  </div>
                </div>
              </div>

              {/* Network Status */}
              {!profileData.networkParticipant && (
                <div className="border border-yellow-500 bg-yellow-50 p-4 rounded-sm">
                  <div className="terminal-text text-sm text-yellow-700">
                    ⚠️ This account is not currently a participant in the trust
                    network merkle tree.
                  </div>
                  <div className="terminal-dim text-xs mt-1 text-yellow-600">
                    Participate in attestations to appear in network rankings.
                  </div>
                </div>
              )}

              {/* Attestations Given Section */}
              <div className="space-y-4">
                <div className="border border-gray-300 bg-white rounded-sm shadow-sm">
                  <div className="border-b border-gray-300 p-4">
                    <div className="ascii-art-title text-lg mb-1 text-gray-900">
                      ATTESTATIONS GIVEN
                    </div>
                    <div className="terminal-dim text-sm text-gray-600">
                      ◢◤ Attestations made by this account ◢◤
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {isLoadingAttestationsGiven && (
                      <div className="text-center py-8">
                        <div className="terminal-bright text-sm text-gray-900">
                          ◉ LOADING ATTESTATIONS ◉
                        </div>
                      </div>
                    )}

                    {!isLoadingAttestationsGiven &&
                      attestationsGiven.length === 0 && (
                        <div className="text-center py-8">
                          <div className="terminal-dim text-sm text-gray-600">
                            NO ATTESTATIONS GIVEN
                          </div>
                          <div className="system-message text-xs mt-2 text-gray-700">
                            ◆ THIS ACCOUNT HAS NOT MADE ANY ATTESTATIONS YET ◆
                          </div>
                        </div>
                      )}

                    {!isLoadingAttestationsGiven &&
                      attestationsGiven
                        .slice(0, 5)
                        .map((attestation) => (
                          <AttestationCard
                            key={attestation.uid}
                            uid={attestation.uid}
                            clickable
                            onClick={() =>
                              router.push(`/attestations/${attestation.uid}`)
                            }
                          />
                        ))}

                    {!isLoadingAttestationsGiven &&
                      attestationsGiven.length > 5 && (
                        <div className="text-center pt-4">
                          <div className="terminal-dim text-sm text-gray-600">
                            Showing 5 of {attestationsGiven.length} attestations
                            given
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Attestations Received Section */}
              <div className="space-y-4">
                <div className="border border-gray-300 bg-white rounded-sm shadow-sm">
                  <div className="border-b border-gray-300 p-4">
                    <div className="ascii-art-title text-lg mb-1 text-gray-900">
                      ATTESTATIONS RECEIVED
                    </div>
                    <div className="terminal-dim text-sm text-gray-600">
                      ◢◤ Attestations received by this account ◢◤
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {isLoadingAttestationsReceived && (
                      <div className="text-center py-8">
                        <div className="terminal-bright text-sm text-gray-900">
                          ◉ LOADING ATTESTATIONS ◉
                        </div>
                      </div>
                    )}

                    {!isLoadingAttestationsReceived &&
                      attestationsReceived.length === 0 && (
                        <div className="text-center py-8">
                          <div className="terminal-dim text-sm text-gray-600">
                            NO ATTESTATIONS RECEIVED
                          </div>
                          <div className="system-message text-xs mt-2 text-gray-700">
                            ◆ THIS ACCOUNT HAS NOT RECEIVED ANY ATTESTATIONS YET
                            ◆
                          </div>
                        </div>
                      )}

                    {!isLoadingAttestationsReceived &&
                      attestationsReceived
                        .slice(0, 5)
                        .map((attestation) => (
                          <AttestationCard
                            key={attestation.uid}
                            uid={attestation.uid}
                            clickable
                            onClick={() =>
                              router.push(`/attestations/${attestation.uid}`)
                            }
                          />
                        ))}

                    {!isLoadingAttestationsReceived &&
                      attestationsReceived.length > 5 && (
                        <div className="text-center pt-4">
                          <div className="terminal-dim text-sm text-gray-600">
                            Showing 5 of {attestationsReceived.length}{' '}
                            attestations received
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={refresh}
                  className="mobile-terminal-btn !px-6 !py-2"
                  disabled={isLoading}
                >
                  <span className="terminal-command text-xs">
                    REFRESH PROFILE
                  </span>
                </Button>
              </div>
            </>
          )}

          {/* No Profile Data */}
          {!isLoading && !profileData && !error && (
            <div className="text-center py-12 border border-gray-300 bg-white rounded-sm shadow-sm">
              <div className="terminal-dim text-sm text-gray-600">
                INVALID ACCOUNT ADDRESS
              </div>
              <div className="system-message text-xs mt-2 text-gray-700">
                ◆ PLEASE PROVIDE A VALID ETHEREUM ADDRESS ◆
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
