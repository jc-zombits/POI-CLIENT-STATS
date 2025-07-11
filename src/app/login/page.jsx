"use client";
import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import NavigationBar from '../../components/NavBar';
import '../../app/auth.css'

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/login', {
        email: values.email,
        password: values.password
      });
      
      // Guardar token y redirigir
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      message.success('Bienvenido!');
      router.push('/cumplimiento');
    } catch (error) {
      message.error(error.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <NavigationBar />
      <div className="auth-form-container">
        <h2>Iniciar Sesión</h2>
        <Form
          layout="vertical"
          onFinish={onFinish}
          className="auth-form"
        >
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
            rules={[{ required: true, message: 'Por favor ingrese su contraseña' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Ingresar
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}