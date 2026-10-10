import { redirect } from 'next/navigation';

export default function NewExpenseClaimPage() {
  redirect('/account/expenses/new');
}
