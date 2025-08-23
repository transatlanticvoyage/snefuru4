import ProtectedLayoutClient from './ProtectedLayoutClient';

export default function Prot5Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}