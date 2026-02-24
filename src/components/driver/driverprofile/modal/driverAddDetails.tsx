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
  if (Number.isNaN(date.getTime())) return undefined
  return dayjs(date);
};

export type DriverPersonalInfoValues = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  driverLicenseNumber?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  languages?: string[];
  licensedSince?: string; // Sprint 2: When driver got their license
  experienceYears?: number; // Sprint 2: Years of driving experience
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
        licensedSince: initialValues.licensedSince
          ? parseDobToDayjs(initialValues.licensedSince)
          : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [form, initialValues, open]);

  const handleFinish = (values: DriverPersonalInfoValues & { dateOfBirth?: dayjs.Dayjs; licensedSince?: dayjs.Dayjs }) => {
    const payload: DriverPersonalInfoValues = {
      fullName: values.fullName,
      email: values.email,
      phoneNumber: values.phoneNumber,
      driverLicenseNumber: values.driverLicenseNumber,
      dateOfBirth: values.dateOfBirth
        ? dayjs(values.dateOfBirth).toISOString()
        : undefined,
      bloodGroup: values.bloodGroup,
      languages: values.languages || [],
      licensedSince: values.licensedSince
        ? dayjs(values.licensedSince).toISOString()
        : undefined,
      experienceYears: values.experienceYears,
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
          ℹ️ <strong>Note:</strong> Name, email, phone, and license number (once set) cannot be changed. You can update your date of birth, blood group, languages, license date, and experience.
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
              name="experienceYears"
              label="Years of Driving Experience"
              rules={[
                { required: true, message: "Please enter your experience in years" },
                { type: 'number', min: 0, max: 50, message: "Experience must be between 0 and 50 years" }
              ]}
              tooltip="Total years of professional driving experience"
            >
              <Input 
                type="number" 
                placeholder="e.g., 5" 
                min={0} 
                max={50}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 12]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="licensedSince"
              label="License Issued Date"
              rules={[{ required: true, message: "Please select when you received your license" }]}
              tooltip="Date when your driving license was first issued"
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default DriverPersonalInfoModal;