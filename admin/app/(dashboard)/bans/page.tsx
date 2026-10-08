import { redirect } from 'next/navigation';

export default function BansRedirect() {
  redirect('/ban-list');
}
