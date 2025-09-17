export const parseErrorMessage = (err: any) => {
  if (!(err instanceof Error)) {
    err = new Error(String(err))
  }

  // TODO: add more error messages
  if (err.message.includes('User rejected the request.')) {
    return 'You rejected the request.'
  }

  return err.message
}
