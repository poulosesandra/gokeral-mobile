import RegistrationForm from "../components/registration/RegistrationForm";

const DriverRegistration = () => {
  return (
    <RegistrationForm
      userType="driver"
      loginLink="/driver/login"
      title="Driver Registration"
      subtitle="Join our team of professional drivers"
      includeDriverFields={true}
    />
  );
};

export default DriverRegistration;
