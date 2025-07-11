"use client";
import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Spin, message } from 'antd';
import axios from 'axios';
import NavigationBar from '../../components/NavBar';
import './usuarios.css';

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await axios.get('/api/usuarios');
        setUsuarios(response.data);
      } catch (error) {
        message.error('Error al cargar usuarios');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  // Datos de módulos de ejemplo (deberías reemplazar esto con tu propia data)
  const modulosData = {
    1: { nombre: 'Financiero', color: 'blue' },
    2: { nombre: 'Operativo', color: 'green' },
    3: { nombre: 'Comercial', color: 'orange' }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Módulo',
      dataIndex: 'modulo_id',
      key: 'modulo',
      render: (moduloId) => (
        moduloId ? (
          <Tag color={modulosData[moduloId]?.color || 'gray'}>
            {modulosData[moduloId]?.nombre || 'Sin asignar'}
          </Tag>
        ) : (
          <Tag color="red">Sin módulo</Tag>
        )
      ),
      filters: Object.values(modulosData).map(mod => ({
        text: mod.nombre,
        value: mod.nombre,
      })),
      onFilter: (value, record) => {
        const modulo = modulosData[record.modulo_id];
        return modulo?.nombre === value;
      },
    },
    {
      title: 'Fecha Registro',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => handleEdit(record)} className="text-blue-500 hover:text-blue-700">Editar</a>
          <a onClick={() => handleDelete(record.id)} className="text-red-500 hover:text-red-700">Eliminar</a>
        </Space>
      ),
    },
  ];

  const handleEdit = (usuario) => {
    // Implementar lógica de edición
    message.info(`Editar usuario ${usuario.id}`);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/usuarios/${id}`);
      setUsuarios(usuarios.filter(user => user.id !== id));
      message.success('Usuario eliminado');
    } catch (error) {
      message.error('Error al eliminar usuario');
    }
  };

  return (
    <div className="usuarios-container">
      <NavigationBar />
      <div className="usuarios-content">
        <div className="header-section">
          <h1 className="page-title">Administración de Usuarios</h1>
        </div>
        
        <div className="table-container">
          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={usuarios}
              rowKey="id"
              bordered
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </Spin>
        </div>
      </div>
    </div>
  );
};

export default UsuariosPage;