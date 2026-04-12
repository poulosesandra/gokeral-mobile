import { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, DatePicker, Select, Row, Col, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { authService } from "../../../../services/authServices";

const parseDobToDayjs = (value?: string) => {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split("/").map(Number);
    return dayjs(new Date(yyyy, mm - 1, dd));
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [yyyy, mm, dd] = raw.split("-").map(Number);
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
  licensedSince?: string;
  experienceYears?: number;
  // Sprint 2: Individual document uploads
  drivingLicenseCertificate?: string;
  policeClearanceCertificate?: string;
  medicalFitnessCertificate?: string;
  addressProof?: string;
  professionalTrainingCertificate?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
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
  
  // Individual document states
  const [drivingLicenseFile, setDrivingLicenseFile] = useState<File | null>(null);
  const [policeClearanceFile, setPoliceClearanceFile] = useState<File | null>(null);
  const [medicalCertFile, setMedicalCertFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [trainingCertFile, setTrainingCertFile] = useState<File | null>(null);

  // Helper: Convert File to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper: Validate file size (max 5MB)
  const validateFileSize = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      message.error(`${file.name} exceeds 5MB. Please upload a smaller file.`);
      return false;
    }
    return true;
  };

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
        emergencyContactName: initialValues.emergencyContact?.name || '',
        emergencyContactPhone: initialValues.emergencyContact?.phone || '',
        emergencyContactRelationship: initialValues.emergencyContact?.relationship || '',
      });
      // Reset file states when modal opens
      setDrivingLicenseFile(null);
      setPoliceClearanceFile(null);
      setMedicalCertFile(null);
      setAddressProofFile(null);
      setTrainingCertFile(null);
    } else {
      form.resetFields();
      setDrivingLicenseFile(null);
      setPoliceClearanceFile(null);
      setMedicalCertFile(null);
      setAddressProofFile(null);
      setTrainingCertFile(null);
    }
  }, [form, initialValues, open]);

  const handleFinish = async (values: any) => {
    try {
      // Presigned-first upload flow with base64 fallback
      const documents: any = {};

      const uploadWithFallback = async (
        file: File,
        category:
          | 'drivingLicenseCertificate'
          | 'policeClearanceCertificate'
          | 'medicalFitnessCertificate'
          | 'addressProof'
          | 'professionalTrainingCertificate',
      ) => {
        try {
          return await authService.uploadDriverFilePresigned(file, category);
        } catch (presignError) {
          console.warn(`Presigned upload failed for ${category}, falling back to base64`, presignError);
          return await convertFileToBase64(file);
        }
      };

      if (drivingLicenseFile) {
        documents.drivingLicenseCertificate = await uploadWithFallback(
          drivingLicenseFile,
          'drivingLicenseCertificate',
        );
      }
      if (policeClearanceFile) {
        documents.policeClearanceCertificate = await uploadWithFallback(
          policeClearanceFile,
          'policeClearanceCertificate',
        );
      }
      if (medicalCertFile) {
        documents.medicalFitnessCertificate = await uploadWithFallback(
          medicalCertFile,
          'medicalFitnessCertificate',
        );
      }
      if (addressProofFile) {
        documents.addressProof = await uploadWithFallback(
          addressProofFile,
          'addressProof',
        );
      }
      if (trainingCertFile) {
        documents.professionalTrainingCertificate = await uploadWithFallback(
          trainingCertFile,
          'professionalTrainingCertificate',
        );
      }

      const payload: DriverPersonalInfoValues = {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        driverLicenseNumber: values.driverLicenseNumber,
        dateOfBirth: values.dateOfBirth
          ? dayjs(values.dateOfBirth).format('YYYY-MM-DD')
          : undefined,
        bloodGroup: values.bloodGroup,
        languages: values.languages || [],
        licensedSince: values.licensedSince
          ? dayjs(values.licensedSince).format('YYYY-MM-DD')
          : undefined,
        experienceYears: values.experienceYears,
        ...documents,
        emergencyContact: (values.emergencyContactName || values.emergencyContactPhone) ? {
          name: values.emergencyContactName,
          phone: values.emergencyContactPhone,
          relationship: values.emergencyContactRelationship,
        } : undefined,
      };

      onSave(payload);
    } catch (error) {
      message.error('Failed to process documents. Please try again.');
    }
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
      destroyOnHidden
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
              <InputNumber 
                style={{ width: '100%' }}
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

        {/* Sprint 2: Individual Document Uploads */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">📄 Required Documents</h3>
          
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Driving License Certificate <span className="text-red-500">*</span>
                </label>
                <Upload
                  beforeUpload={(file) => {
                    if (!validateFileSize(file)) return false;
                    setDrivingLicenseFile(file);
                    message.success(`${file.name} selected`);
                    return false;
                  }}
                  showUploadList={false}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />} size="small" block>
                    {drivingLicenseFile ? `✓ ${drivingLicenseFile.name}` : 'Upload License (Max 5MB)'}
                  </Button>
                </Upload>
                {drivingLicenseFile && (
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => setDrivingLicenseFile(null)}
                    className="mt-1"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Police Clearance Certificate <span className="text-red-500">*</span>
                </label>
                <Upload
                  beforeUpload={(file) => {
                    if (!validateFileSize(file)) return false;
                    setPoliceClearanceFile(file);
                    message.success(`${file.name} selected`);
                    return false;
                  }}
                  showUploadList={false}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />} size="small" block>
                    {policeClearanceFile ? `✓ ${policeClearanceFile.name}` : 'Upload Certificate (Max 5MB)'}
                  </Button>
                </Upload>
                {policeClearanceFile && (
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => setPoliceClearanceFile(null)}
                    className="mt-1"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Medical Fitness Certificate <span className="text-red-500">*</span>
                </label>
                <Upload
                  beforeUpload={(file) => {
                    if (!validateFileSize(file)) return false;
                    setMedicalCertFile(file);
                    message.success(`${file.name} selected`);
                    return false;
                  }}
                  showUploadList={false}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />} size="small" block>
                    {medicalCertFile ? `✓ ${medicalCertFile.name}` : 'Upload Medical Cert (Max 5MB)'}
                  </Button>
                </Upload>
                {medicalCertFile && (
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => setMedicalCertFile(null)}
                    className="mt-1"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Address Proof <span className="text-red-500">*</span>
                </label>
                <Upload
                  beforeUpload={(file) => {
                    if (!validateFileSize(file)) return false;
                    setAddressProofFile(file);
                    message.success(`${file.name} selected`);
                    return false;
                  }}
                  showUploadList={false}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />} size="small" block>
                    {addressProofFile ? `✓ ${addressProofFile.name}` : 'Upload Address Proof (Max 5MB)'}
                  </Button>
                </Upload>
                {addressProofFile && (
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => setAddressProofFile(null)}
                    className="mt-1"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Professional Training Certificate (Optional)
                </label>
                <Upload
                  beforeUpload={(file) => {
                    if (!validateFileSize(file)) return false;
                    setTrainingCertFile(file);
                    message.success(`${file.name} selected`);
                    return false;
                  }}
                  showUploadList={false}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />} size="small" block>
                    {trainingCertFile ? `✓ ${trainingCertFile.name}` : 'Upload Training Cert (Max 5MB)'}
                  </Button>
                </Upload>
                {trainingCertFile && (
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => setTrainingCertFile(null)}
                    className="mt-1"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </Col>
          </Row>

          <p className="text-xs text-gray-600 mt-2">
            ⚠️ Each document must be under 5MB. Accepted formats: PDF, JPG, JPEG, PNG
          </p>
        </div>

        {/* Sprint 2: Emergency Contact */}
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="text-sm font-semibold text-orange-800 mb-3">🆘 Emergency Contact (Optional)</h3>
          
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="emergencyContactName"
                label={<span className="text-xs">Contact Name</span>}
              >
                <Input placeholder="Full name" size="small" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="emergencyContactPhone"
                label={<span className="text-xs">Contact Phone</span>}
              >
                <Input placeholder="Phone number" size="small" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="emergencyContactRelationship"
                label={<span className="text-xs">Relationship</span>}
              >
                <Select placeholder="Select" size="small" options={[
                  { label: 'Spouse', value: 'Spouse' },
                  { label: 'Parent', value: 'Parent' },
                  { label: 'Sibling', value: 'Sibling' },
                  { label: 'Friend', value: 'Friend' },
                  { label: 'Other', value: 'Other' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Modal>
  );
};

export default DriverPersonalInfoModal;