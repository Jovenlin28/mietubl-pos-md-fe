export interface Expense {
  id: number;
  purchaseDate: string;
  expenseCategory: string;
  itemDescription: string;
  totalCost: string;
  status: string;
  receiptNo?: string;
  vendorName?: string;
  tinNo?: string;
  businessAddress?: string;
  createdOn?: string;
  attachment?: string;
}