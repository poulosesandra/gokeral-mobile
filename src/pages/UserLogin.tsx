import LoginForm from "../components/login/LoginForm";

const UserLogin = () => {
  return (
    <LoginForm
      userType="user"
      apiEndpoint="/users/login"
      navigateTo="/user/dashboard"
      registerLink="/user/register"
      title="User Login"
      subtitle="Welcome back! Sign in to your account"
      forgotPasswordLink="/user/forgot-password"
    />
  );
};

export default UserLogin;