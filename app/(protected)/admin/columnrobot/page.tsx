import { Metadata } from 'next';
import ColumnRobotClient from './pclient';

export const metadata: Metadata = {
  title: 'Column Robot - Snefuru Admin',
};

export default function ColumnRobotPage() {
  return <ColumnRobotClient />;
}