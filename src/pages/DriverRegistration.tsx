import RegistrationForm from "../components/registration/RegistrationForm";

const DriverRegistration = () => {
  return (
    <RegistrationForm
      userType="driver"
      apiEndpoint="/api/auth/driver/register"
      navigateTo="/driver/dashboard"
      loginLink="/driver/login"
      title="Driver Registration"
      subtitle="Join our team of professional drivers"
      includeDriverFields={true}
    />
  );
};

export default DriverRegistration;
