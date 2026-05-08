import LoginForm from "../../components/login/LoginForm";

const AdminLogin = () => {
  return (
    <LoginForm
      userType="admin"
      navigateTo="/admin"
      registerLink="/user/register"
      title="Admin Login"
      subtitle="Sign in to the admin dashboard"
      forgotPasswordLink="/user/forgot-password"
      switchLoginLink="/user/login"
      switchLoginText="Login as User"
    />
  );
};

export default AdminLogin;
