import RegistrationForm from "../components/registration/RegistrationForm";

const UserRegister = () => {
  return (
    <RegistrationForm
      userType="user"
      loginLink="/user/login"
      title="Create Account"
      subtitle="Sign up to get started"
    />
  );
};

export default UserRegister;