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
        ? dayjs(values.dateOfBirth).format("DD/MM/YYYY")
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
              label="Name"
              rules={[{ required: true, message: "Please enter name" }]}
            >
              <Input placeholder="Full name" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: "email", message: "Please enter a valid email" }]}
            >
              <Input placeholder="Email address" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="phoneNumber"
              label="Telephone"
              rules={[
                { required: true, message: "Enter phone number" },
                {
                  pattern: /^\d{10}$/,
                  message: "Enter a 10-digit phone number (digits only)",
                },
              ]}
            >
              <Input placeholder="e.g. 9876543210" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="driverLicenseNumber"
              label="Driving Licence"
              rules={[{ required: true, message: "Enter driving licence number" }]}
            >
              <Input placeholder="Licence number" />
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

        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: "Please enter your address" }]}
        >
          <Input.TextArea rows={3} placeholder="House number, street, city, state" />
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
              label="Certifications"
              rules={[{ required: true, message: "Please select certifications" }]}
            >
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="Select or enter certifications"
                options={certificationOptions.map((cert) => ({ label: cert, value: cert }))}
                filterOption={(input, option) =>
                  (option?.label as string).toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Emergency Contact"
          required
          style={{ marginBottom: 8 }}
        />

        <Row gutter={[16, 12]}>
          <Col xs={24} md={8}>
            <Form.Item
              name={["emergencyContact", "name"]}
              label="Name"
              rules={[{ required: true, message: "Enter contact name" }]}
            >
              <Input placeholder="Contact person name" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name={["emergencyContact", "phone"]}
              label="Contact Number"
              rules={[
                { required: true, message: "Enter contact number" },
                {
                  pattern: /^\d{10}$/,
                  message: "Enter a 10-digit phone number (digits only)",
                },
              ]}
            >
              <Input placeholder="e.g. 9876543210" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name={["emergencyContact", "relation"]}
              label="Relation"
              rules={[{ required: true, message: "Enter relation" }]}
            >
              <Input placeholder="Relation to you" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default DriverPersonalInfoModal;