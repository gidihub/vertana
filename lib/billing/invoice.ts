export interface InvoiceView {
  id: string
  number: string | null
  /** Unix seconds. */
  created: number
  amountPaid: number
  currency: string
  status: string | null
  hostedUrl: string | null
  pdfUrl: string | null
}
