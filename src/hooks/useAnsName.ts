import { useState, useEffect } from 'react';

const ANS_INDEXER = 'https://api.mainnet.aptoslabs.com/v1/graphql';

export function useAnsName(address: string) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const lookup = async () => {
      const addr = address.toLowerCase();

      try {
        const res = await fetch(ANS_INDEXER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query GetAnsName($address: String) {
              current_aptos_names(
                where: {
                  registered_address: { _eq: $address }
                  is_active: { _eq: true }
                }
                order_by: { expiration_timestamp: desc }
                limit: 1
              ) { domain subdomain }
            }`,
            variables: { address: addr },
          }),
        });
        const data = await res.json();
        const names = data?.data?.current_aptos_names;
        if (names?.length > 0) {
          const { domain, subdomain } = names[0];
          // Always use just domain.apt — ignore subdomain
          const fullName = `${domain}.apt`;
          setName(fullName);
          return;
        }
      } catch {}

      // Fallback: aptosnames.com
      try {
        const res2 = await fetch(`https://www.aptosnames.com/api/mainnet/v1/address/${addr}`);
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2?.name) {
            setName(data2.name.endsWith('.apt') ? data2.name : data2.name + '.apt');
          }
        }
      } catch {}
    };

    lookup();
  }, [address]);

  return name;
}
