/**
 * Universal clipboard copy utility with fallback for HTTP/non-secure contexts.
 */
export async function copyText(text: string): Promise<boolean> {
  // Try modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('navigator.clipboard failed, falling back to textarea execCommand', err)
    }
  }

  // Fallback for HTTP (localhost) or restricted permissions
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    textArea.remove()
    return successful
  } catch (err) {
    console.error('Fallback copy failed', err)
    return false
  }
}
