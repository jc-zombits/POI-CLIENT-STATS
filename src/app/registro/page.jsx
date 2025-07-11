"use client";
import React, { useState } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import NavigationBar from '../../components/NavBar';
import '../../app/auth.css'

const { Option } = Select;

export default function RegistroPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/registro', {
        nombre: values.nombre,
        email: values.email,
        password: values.password,
        modulo_id: values.modulo
      });
      
      message.success('Registro exitoso! Redirigiendo...');
      router.push('/login');
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  // Datos de ejemplo - reemplazar con consulta a tu API
  const modulos = [
    { id: 1, nombre: 'Módulo Financiero' },
    { id: 2, nombre: 'Módulo Operativo' },
    { id: 3, nombre: 'Módulo Comercial' }
  ];

  return (
    <div className="auth-container">
      <NavigationBar />
      <div className="auth-form-container">
        <h2>Registro de Usuario</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="auth-form"
        >
          <Form.Item
            name="nombre"
            label="Nombre Completo"
            rules={[{ required: true, message: 'Por favor ingrese su nombre' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Correo Electrónico"
            rules={[
              { required: true, message: 'Por favor ingrese su correo' },
              { type: 'email', message: 'Correo no válido' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="Contraseña"
            rules={[
              { required: true, message: 'Por favor ingrese una contraseña' },
              { min: 6, message: 'Mínimo 6 caracteres' }
            ]}
            hasFeedback
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Confirmar Contraseña"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Por favor confirme su contraseña' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Las contraseñas no coinciden'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="modulo"
            label="Módulo Asignado"
            rules={[{ required: true, message: 'Seleccione un módulo' }]}
          >
            <Select placeholder="Seleccione un módulo">
              {modulos.map(modulo => (
                <Option key={modulo.id} value={modulo.id}>
                  {modulo.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Registrarse
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}