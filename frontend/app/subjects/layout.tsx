import AuthGuard from '../auth/AuthGuard';

type SubjectsLayoutProps = {
  children: React.ReactNode;
};

export default function SubjectsLayout({ children }: SubjectsLayoutProps) {
  return <AuthGuard>{children}</AuthGuard>;
}
