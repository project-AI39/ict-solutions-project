// pages/dashboard.tsx
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies.token;

  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false, // 302 リダイレクト
      },
    };
  }

  return { props: {} };
};

export default function Dashboard() {
  return <div>サーバーサイドで認証済みページ</div>;
}
