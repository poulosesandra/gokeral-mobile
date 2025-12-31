import LoginForm from "../components/login/LoginForm";

const UserLogin = () => {
  return (
    <LoginForm
      userType="user"
      navigateTo="/map"
      registerLink="/user/register"
      title="User Login"
      subtitle="Welcome back! Sign in to your account"
      forgotPasswordLink="/user/forgot-password"
    />
  );
};

export default UserLogin;