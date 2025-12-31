import { useEffect } from "react";
import { Modal, Form, Input, DatePicker, Select, Row, Col } from "antd";
import dayjs from "dayjs";

type EmergencyContact = {
	name: string;
	phone: string;
	relation: string;
};

export type DriverPersonalInfoValues = {
	dateOfBirth?: string;
	bloodGroup?: string;
	address?: string;
	languages?: string[];
	certifications?: string[];
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
					? dayjs(initialValues.dateOfBirth, "DD/MM/YYYY")
					: undefined,
			});
		} else {
			form.resetFields();
		}
	}, [form, initialValues, open]);

	const handleFinish = (values: DriverPersonalInfoValues & { dateOfBirth?: dayjs.Dayjs }) => {
		const payload: DriverPersonalInfoValues = {
			...values,
			dateOfBirth: values.dateOfBirth
				? dayjs(values.dateOfBirth).format("DD/MM/YYYY")
				: undefined,
			languages: values.languages || [],
			certifications: values.certifications || [],
			emergencyContact: values.emergencyContact || undefined,
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
							name="certifications"
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
									pattern: /^[0-9+\-\s]{7,20}$/,
									message: "Enter a valid phone number",
								},
							]}
						>
							<Input placeholder="e.g. +91 98765 43210" />
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
