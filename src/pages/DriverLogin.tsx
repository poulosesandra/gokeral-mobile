import LoginForm from "../components/login/LoginForm";

const DriverLogin = () => {
  return (
    <LoginForm
      userType="driver"
      navigateTo="/driver/dashboard"
      registerLink="/driver/register"
      title="Driver Login"
      subtitle="Access your professional driver account"
      forgotPasswordLink="/driver/forgot-password"
    />
  );
};

export default DriverLogin;
