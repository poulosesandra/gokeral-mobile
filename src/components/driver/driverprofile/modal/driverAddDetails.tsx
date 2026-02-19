import { useEffect } from "react";
import { Modal, Form, Input, DatePicker, Select, Row, Col } from "antd";
import dayjs from "dayjs";
const parseDobToDayjs = (value?: string) => {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split("/").map(Number);
    return dayjs(new Date(yyyy, mm - 1, dd));
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return undefined;
  return dayjs(date);
};

type EmergencyContact = {
  name: string;
  phone: string;
  relation: string;
};

export type DriverPersonalInfoValues = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  driverLicenseNumber?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  languages?: string[];
  certificates?: string[];
  emergencyContact?: EmergencyContact;
};

type DriverPersonalInfoModalProps = {
  open: boolean;
  loading?: boolean;
  initialValues?: DriverPersonalInfoValues;
  onCancel: () => void;
  onSave: (values: DriverPersonalInfoValues) => void;
};

const bloodGroups = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const certificationOptions = [
  "Defensive Driving Certified",
  "First Aid Certified",
  "Hazardous Materials Endorsement",
  "Commercial Driving License",
  "Customer Service Training",
];

const languageOptions = [
  "English",
  "Hindi",
  "Malayalam",
  "Tamil",
  "Kannada",
  "Arabic",
];

const DriverPersonalInfoModal = ({
  open,
  loading,
  initialValues,
  onCancel,
  onSave,
}: DriverPersonalInfoModalProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        dateOfBirth: initialValues.dateOfBirth
          ? parseDobToDayjs(initialValues.dateOfBirth)
          : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [form, initialValues, open]);

  const handleFinish = (values: DriverPersonalInfoValues & { dateOfBirth?: dayjs.Dayjs }) => {
    const payload: DriverPersonalInfoValues = {
      fullName: values.fullName,
      email: values.email,
      phoneNumber: values.phoneNumber,
      driverLicenseNumber: values.driverLicenseNumber,
      dateOfBirth: values.dateOfBirth
        ? dayjs(values.dateOfBirth).toISOString()
        : undefined,
      languages: values.languages || [],
      certificates: values.certificates || [],
      address: values.address,
      emergencyContact: values.emergencyContact || undefined,
      bloodGroup: values.bloodGroup,
    };

    onSave(payload);
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      open={open}
      title="Driver Personal Information"
      onCancel={handleCancel}
      okText="Save"
      cancelText="Cancel"
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={720}
      destroyOnClose
    >
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          ℹ️ <strong>Note:</strong> Name, email, phone, and license number cannot be changed. Only personal information fields can be updated.
        </p>
      </div>

      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        requiredMark="optional"
      >
        {/* Bio & other details */}
        <Row gutter={[16, 12]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="fullName"
              label="Name (Read-only)"
            >
              <Input placeholder="Full name" disabled className="bg-gray-100" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="email"
              label="Email (Read-only)"
            >
              <Input placeholder="Email address" disabled className="bg-gray-100" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="phoneNumber"
              label="Phone Number (Read-only)"
            >
              <Input placeholder="Phone number" disabled className="bg-gray-100" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="driverLicenseNumber"
              label={
                initialValues?.driverLicenseNumber 
                  ? "Driving Licence (Cannot be changed)" 
                  : "Driving Licence (Required)"
              }
              rules={
                !initialValues?.driverLicenseNumber 
                  ? [{ required: true, message: 'Please enter your driving license number' }] 
                  : []
              }
              tooltip={
                initialValues?.driverLicenseNumber
                  ? "License number cannot be changed once set"
                  : "Enter your driving license number (e.g., KL-1234567890123)"
              }
            >
              <Input 
                placeholder="Licence number" 
                disabled={!!initialValues?.driverLicenseNumber} 
                className={initialValues?.driverLicenseNumber ? "bg-gray-100" : ""}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 12]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="dateOfBirth"
              label="Date of Birth"
              rules={[{ required: true, message: "Please select your date of birth" }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="bloodGroup"
              label="Blood Group"
              rules={[{ required: true, message: "Please choose your blood group" }]}
            >
              <Select
                placeholder="Select blood group"
                options={bloodGroups.map((group) => ({ label: group, value: group }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Address - Disabled for now */}
        <Form.Item
          name="address"
          label="Address (Coming in Sprint 2)"
          tooltip="Address field is not yet supported by the backend"
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Will be available in the next update" 
            disabled 
            className="bg-gray-100" 
          />
        </Form.Item>

        <Row gutter={[16, 12]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="languages"
              label="Languages Spoken"
              rules={[{ required: true, message: "Please add at least one language" }]}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder="Select or type languages"
                options={languageOptions.map((lang) => ({ label: lang, value: lang }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="certificates"
              label="Certifications (Coming in Sprint 2)"
              tooltip="Certificates field is not yet supported by the backend"
            >
              <Select
                mode="multiple"
                allowClear
                disabled
                className="bg-gray-100"
                placeholder="Will be available in the next update"
                options={certificationOptions.map((cert) => ({ label: cert, value: cert }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Emergency Contact - Disabled for now */}
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Emergency Contact</strong> feature is coming in Sprint 2. Currently not supported by backend.
          </p>
        </div>

        <Row gutter={[16, 12]}>
          <Col xs={24} md={8}>
            <Form.Item
              name={["emergencyContact", "name"]}
              label="Name"
            >
              <Input placeholder="Not available yet" disabled className="bg-gray-100" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name={["emergencyContact", "phone"]}
              label="Contact Number"
            >
              <Input placeholder="Not available yet" disabled className="bg-gray-100" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name={["emergencyContact", "relation"]}
              label="Relation"
            >
              <Input placeholder="Not available yet" disabled className="bg-gray-100" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default DriverPersonalInfoModal;