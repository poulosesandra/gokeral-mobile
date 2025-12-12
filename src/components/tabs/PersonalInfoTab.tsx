"use client";

import {
  Card,
  Form,
  Input,
  Button,
  Skeleton,
  Typography,
  Row,
  Col,
  message,
  Upload,
  Modal,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  UploadOutlined,
  SaveOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import type { UserData } from "../profile/UserProfile";
import type { UploadFile, RcFile, UploadProps } from "antd/es/upload/interface";

const { Title, Paragraph } = Typography;

interface PersonalInfoTabProps {
  userData: UserData;
  loading: boolean;
  updateUserData: (values: Partial<UserData>) => Promise<void>;
}

export const PersonalInfoTab = ({
  userData,
  loading,
  updateUserData,
}: PersonalInfoTabProps) => {
  const [form] = Form.useForm();
  const [saveLoading, setSaveLoading] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    userData?.profileImage || ""
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [_fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    form.setFieldsValue(userData || {});
    setFormChanged(false);

    // Initialize fileList if we have a profile picture
    if (userData?.profileImage) {
      setFileList([
        {
          uid: "-1",
          name: "profile-picture.png",
          status: "done",
          url: userData.profileImage,
        },
      ]);
    } else {
      setFileList([]);
    }
  }, [userData, form]);

  const onFinish = async (values: any) => {
    try {
      setSaveLoading(true);

      // Add the profile picture to the values
      if (imageUrl) {
        values.profileImage = imageUrl;
      }

      console.log(values);

      await updateUserData(values);
      message.success("Profile updated successfully!");
      setFormChanged(false);
    } catch (error) {
      message.error("Failed to update profile. Please try again.");
      console.error("Error updating profile:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFormChange = () => {
    const currentValues = form.getFieldsValue();
    const hasChanged =
      Object.keys(currentValues).some(
        (key) => currentValues[key] !== userData[key as keyof UserData]
      ) || imageUrl !== userData?.profileImage;

    setFormChanged(hasChanged);
  };

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handlePreview = () => {
    setPreviewImage(imageUrl || "");
    setPreviewOpen(true);
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setFileList(newFileList);

    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      getBase64(newFileList[0].originFileObj as RcFile).then((url) => {
        setImageUrl(url);
        setFormChanged(true);
      });
    } else if (newFileList.length === 0) {
      setImageUrl(undefined);
      setFormChanged(true);
    }
  };

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG files!");
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must be smaller than 2MB!");
    }

    return isJpgOrPng && isLt2M;
  };

  const removeImage = () => {
    setImageUrl(undefined);
    setFileList([]);
    setFormChanged(true);
    message.success("Profile picture removed");
  };

  return (
    <Card className="shadow-lg">
      <Title level={4} className="!mb-2 text-xl sm:text-2xl">
        Personal Information
      </Title>
      <Paragraph className="text-gray-500 text-sm sm:text-base mb-6">
        Update your personal detailsss
      </Paragraph>

      <Skeleton loading={loading} active>
        <div className="flex flex-col items-center mb-8">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-5 flex items-center justify-center"
            style={{
              width: "180px",
              height: "180px",
              boxShadow: "0 4px 14px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="User avatar"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <UserOutlined style={{ fontSize: "64px", color: "white" }} />
            )}
          </div>

          <div className="flex justify-center items-center gap-3 mt-4">
            <Upload
              name="avatar"
              showUploadList={false}
              beforeUpload={beforeUpload}
              onChange={handleChange}
              maxCount={1}
              accept="image/png, image/jpeg"
            >
              <Button
                type="primary"
                icon={<UploadOutlined />}
                className="flex items-center"
                size="large"
              >
                {imageUrl ? "Change Picture" : "Upload Picture"}
              </Button>
            </Upload>

            {imageUrl && (
              <>
                <Tooltip title="View Image">
                  <Button
                    icon={<EyeOutlined />}
                    onClick={handlePreview}
                    className="flex items-center"
                    size="large"
                  />
                </Tooltip>

                <Tooltip title="Remove Image">
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={removeImage}
                    className="flex items-center"
                    size="large"
                  />
                </Tooltip>
              </>
            )}
          </div>
        </div>

        <Modal
          open={previewOpen}
          title="Profile Picture Preview"
          footer={null}
          onCancel={() => setPreviewOpen(false)}
          width={600}
        >
          <div className="flex justify-center">
            <img
              alt="Profile preview"
              style={{ maxWidth: "100%", maxHeight: "500px" }}
              src={previewImage}
            />
          </div>
        </Modal>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={userData}
          className="w-full"
          onValuesChange={handleFormChange}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: "Please input your name!" }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Your name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Your email" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="phoneNumber"
                label="Phone"
                rules={[
                  {
                    required: true,
                    message: "Please input your phone number!",
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Your phone number"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="location"
                label="Address"
                rules={[
                  { required: true, message: "Please input your address!" },
                ]}
              >
                <Input
                  prefix={<EnvironmentOutlined />}
                  placeholder="Your address"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full mt-4"
              size="large"
              loading={saveLoading}
              disabled={!formChanged}
              icon={<SaveOutlined />}
            >
              {saveLoading ? "Saving Changes..." : "Save Changes"}
            </Button>
          </Form.Item>
        </Form>
      </Skeleton>
    </Card>
  );
};
