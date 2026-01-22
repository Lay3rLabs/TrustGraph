import { IS_PRODUCTION } from '../ponder.config'

export const revalidateNetwork = async (networkId: string = 'all') => {
  if (IS_PRODUCTION) {
    await fetch(`https://trustgraph.network/api/revalidate/${networkId}`).catch(
      (err) => {
        console.error('Error revalidating networks', err)
      }
    )
  }
}
