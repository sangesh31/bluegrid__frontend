import { Shield, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

interface BlockchainBadgeProps {
  txHash?: string;
  reportId: number;
  compact?: boolean;
}

export const BlockchainBadge = ({ txHash, reportId, compact = false }: BlockchainBadgeProps) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!txHash) {
    return null;
  }

  // Determine network (Mumbai testnet or Polygon mainnet)
  const isMainnet = process.env.VITE_BLOCKCHAIN_NETWORK === 'polygon';
  const explorerUrl = isMainnet
    ? `https://polygonscan.com/tx/${txHash}`
    : `https://mumbai.polygonscan.com/tx/${txHash}`;

  const networkName = isMainnet ? 'Polygon' : 'Polygon Mumbai';

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
        <Shield className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-blue-700 font-medium">Blockchain Verified</span>
      </div>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-blue-900">Blockchain Verified</h3>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          
          <p className="text-sm text-blue-700 mb-3">
            This report is permanently recorded on {networkName} blockchain
          </p>

          {showDetails && (
            <div className="bg-white p-3 rounded-lg border border-blue-200 mb-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Transaction Hash:</span>
                <code className="text-blue-600 font-mono text-[10px]">
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </code>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Network:</span>
                <span className="text-gray-900 font-medium">{networkName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Report ID:</span>
                <span className="text-gray-900 font-medium">#{reportId}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open(explorerUrl, '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View on Explorer
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Immutable • Transparent • Verifiable</span>
        </div>
      </div>
    </Card>
  );
};
