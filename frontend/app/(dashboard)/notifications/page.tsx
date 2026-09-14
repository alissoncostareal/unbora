import { redirect } from 'next/navigation';

/** Notificações saíram do portal — moderação agora é Eventos. */
export default function NotificationsRedirectPage() {
  redirect('/events');
}
