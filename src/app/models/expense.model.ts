export interface Expense {
  id: string;
  amount: number;
  date: string; // ISO date
  category: string;
  notes?: string;
}
