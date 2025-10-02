// components/ProtectedRoute.js
export async function getServerSideProps(context) {
  const token = context.req.cookies.token;

  if (!token) {
    return {
      redirect: {
        destination: "/index",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
