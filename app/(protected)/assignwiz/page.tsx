import { Metadata } from 'next';
import AssignwizClient from './pclient';

export const metadata: Metadata = {
  title: '/assignwiz - Assignment Wizard',
};

export default function AssignwizPage() {
  return <AssignwizClient />;
}
